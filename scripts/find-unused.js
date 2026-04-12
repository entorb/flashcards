#!/usr/bin/env node

// run via
// pnpm run find-unused

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import readline from 'node:readline'

/**
 * Escape special regex characters in a string so it can be safely used in new RegExp()
 */
function escapeRegex(str) {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

/**
 * Recursively extract all translation keys from the TEXT_DE object
 */
function extractTranslationKeys(obj, prefix = '') {
  const keys = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively extract nested keys
      keys.push(...extractTranslationKeys(value, fullKey))
    } else {
      // Leaf node - this is a translation key
      keys.push({
        key,
        fullKey,
        type: 'translation'
      })
    }
  }

  return keys
}

/**
 * Extract translation keys directly from the TEXT_DE source text
 * without evaluating it as code (avoids new Function / eval).
 * Walks the brace-nesting to build dotted key paths.
 */
function extractTranslationKeysFromSource(source) {
  const keys = []
  const stack = [] // current nesting path

  const lines = source.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue
    }

    // Match: key: {} or key: {}, (empty object on one line — skip, no leaves inside)
    if (/^(['"]?)(\w+)\1\s*:\s*\{\s*\},?$/.test(trimmed)) {
      continue
    }

    // Match: key: { (nested object — push onto stack)
    const nestedMatch = trimmed.match(/^(['"]?)(\w+)\1\s*:\s*\{/)
    if (nestedMatch) {
      stack.push(nestedMatch[2])
      continue
    }

    // Count closing braces at start of line — pop one level per brace
    const closingMatch = trimmed.match(/^(\}[\s,]*)+/)
    if (closingMatch) {
      const braceCount = (closingMatch[0].match(/\}/g) || []).length
      for (let i = 0; i < braceCount; i++) {
        stack.pop()
      }
      continue
    }

    // Match: key: value (leaf — this is a translation key)
    const leafMatch = trimmed.match(/^(['"]?)(\w+)\1\s*:/)
    if (leafMatch) {
      const key = leafMatch[2]
      const fullKey = [...stack, key].join('.')
      keys.push({ key, fullKey, type: 'translation' })
    }
  }

  return keys
}

/**
 * Extract exported constants from a TypeScript file
 */
function extractConstants(filePath, appName) {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const constants = []

  // Match: export const CONSTANT_NAME = ...
  const exportRegex = /export const\s+([A-Z_][A-Z0-9_]*)\s*=/g
  let match

  while ((match = exportRegex.exec(fileContent)) !== null) {
    const name = match[1]
    constants.push({
      key: name,
      fullKey: name,
      type: 'constant',
      app: appName,
      file: filePath
    })
  }

  // Also match re-exports: export { ... } from '@flashcards/shared'
  const reexportRegex = /export\s*{\s*([^}]+)\s*}\s*from/g
  while ((match = reexportRegex.exec(fileContent)) !== null) {
    const reexports = match[1].split(',').map(item => {
      const parts = item.trim().split(/\s+as\s+/)
      return parts[parts.length - 1] // Get the exported name
    })

    for (const name of reexports) {
      constants.push({
        key: name,
        fullKey: name,
        type: 'constant',
        app: appName,
        file: filePath
      })
    }
  }

  return constants
}

/**
 * Extract CSS/SCSS class names from style files and Vue <style> blocks
 */
function extractCSSClasses(dirPath, ignore = []) {
  const classes = []
  const styleFiles = findFiles(dirPath, ['css', 'scss', 'sass'], ignore)
  const vueFiles = findFiles(dirPath, ['vue'], ignore)
  const skipPatterns = ['quasar', 'bootstrap', 'animate']

  // Helper function to extract classes from CSS content
  function extractFromCSSContent(content, file) {
    // Match: .classname { or .classname,
    // Handles: .class-name, .className, .class_name
    const classRegex = /\.([a-zA-Z_][\w-]*)\s*[{,]/g
    let match

    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1]

      // Skip common utility/framework classes and pseudo-selectors
      if (
        !className.match(
          /^(w-|h-|p-|m-|text-|bg-|border-|flex|grid|hidden|block|inline|absolute|relative|fixed|sticky|container|row|col|col-|breakpoint-|before|after|first|last|hover|active|focus|disabled)/
        )
      ) {
        classes.push({
          key: className,
          fullKey: className,
          type: 'cssclass',
          file
        })
      }
    }
  }

  // Extract from standalone CSS/SCSS/SASS files
  for (const file of styleFiles) {
    // Skip framework/library files
    if (skipPatterns.some(pattern => file.includes(pattern))) {
      continue
    }

    try {
      const content = fs.readFileSync(file, 'utf-8')
      extractFromCSSContent(content, file)
    } catch {
      continue
    }
  }

  // Extract from Vue file <style> blocks
  for (const file of vueFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8')

      // Extract content between <style> tags
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
      let match

      while ((match = styleRegex.exec(content)) !== null) {
        const styleContent = match[1]
        extractFromCSSContent(styleContent, file)
      }
    } catch {
      continue
    }
  }

  // Remove duplicates
  const seen = new Set()
  return classes.filter(c => {
    if (seen.has(c.fullKey)) return false
    seen.add(c.fullKey)
    return true
  })
}

/**
 * Extract exported functions from TypeScript/JavaScript files
 */
function extractExportedFunctions(dirPath, ignore = []) {
  const functions = []
  const sourceFiles = findFiles(dirPath, ['ts', 'js'], ignore) // Only .ts and .js, not .vue
  const ignorePatterns = ['dist', '.cache', '.test', '.spec']

  for (const file of sourceFiles) {
    // Skip test files and build artifacts
    if (ignorePatterns.some(pattern => file.includes(pattern))) {
      continue
    }

    try {
      const content = fs.readFileSync(file, 'utf-8')

      // Match: export function name(...) - only actual function declarations
      const functionRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\(/g
      let match

      while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1]

        // Skip common patterns that are not actual functions
        if (!functionName.match(/^(computed|ref|watch|provide|inject|use|get|set)/i)) {
          functions.push({
            key: functionName,
            fullKey: functionName,
            type: 'function',
            file
          })
        }
      }
    } catch {
      continue
    }
  }

  // Remove duplicates
  const seen = new Set()
  return functions.filter(f => {
    const key = `${f.key}:${f.file}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Parse .gitignore patterns and return normalized ignore list
 */
function parseGitignore(gitignorePath) {
  const ignorePatterns = []

  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8')
    const lines = content.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }
      // Skip negation patterns (we're building an ignore list)
      if (trimmed.startsWith('!')) {
        continue
      }
      // Remove trailing slash for directory patterns
      const pattern = trimmed.replace(/\/$/, '')
      ignorePatterns.push(pattern)
    }
  } catch {
    // If .gitignore doesn't exist, return empty
  }

  return ignorePatterns
}

/**
 * Check if a path matches any gitignore pattern
 */
function shouldIgnorePath(filePath, ignorePatterns) {
  const relativePath = filePath.replace(process.cwd(), '').replace(/^\//, '')

  for (const pattern of ignorePatterns) {
    // Handle wildcard patterns like *.tsbuildinfo
    if (pattern.includes('*')) {
      const regexPattern = pattern.replaceAll('.', String.raw`\.`).replaceAll('*', '.*')
      const regex = new RegExp(String.raw`(^|/)${regexPattern}($|/)`)
      if (regex.test(relativePath)) {
        return true
      }
    } else if (relativePath.includes(pattern)) {
      return true
    }
  }

  return false
}

/**
 * Recursively find all files in a directory
 */
function findFiles(dir, extensions = ['ts', 'vue', 'js'], ignorePatterns = []) {
  const files = []

  function traverse(currentPath) {
    let entries = []
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      // Skip ignored paths (from .gitignore)
      if (shouldIgnorePath(fullPath, ignorePatterns)) {
        continue
      }

      if (entry.isDirectory()) {
        traverse(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).slice(1)
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  }

  traverse(dir)
  return files
}

/**
 * Search for usage of a translation key in the codebase
 */
function findKeyUsage(key, files) {
  const parts = key.split('.')
  const escapedKey = escapeRegex(key)
  const escapedParts = parts.map(p => escapeRegex(p))

  const patterns = [
    // Dot notation: TEXT_DE.voc.cards.export
    new RegExp(String.raw`TEXT_DE\.${escapedKey}\b`),
    // Bracket notation with various combinations
    new RegExp(String.raw`TEXT_DE\['${escapedParts[0]}'\]\['${escapedParts[1]}'\]`),
    new RegExp(String.raw`TEXT_DE\['${escapedParts[0]}'\]\.${escapedParts[1]}`),
    new RegExp(String.raw`TEXT_DE\.${escapedParts[0]}\['${escapedParts[1]}'\]`)
  ]

  // Dynamic access: TEXT_DE[variable].section.key (skip first part, match rest)
  if (parts.length >= 2) {
    const restKey = parts.slice(1).map(p => escapeRegex(p)).join(String.raw`\.`)
    patterns.push(new RegExp(String.raw`TEXT_DE\[[^\]]+\]\.${restKey}\b`))
  }

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8')
      // Strip comments to avoid false positives
      content = stripComments(content)
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return true
        }
      }
    } catch {
      continue
    }
  }

  return false
}

/**
 * Search for usage of a constant in the codebase
 */
function findConstantUsage(constantName, files, excludeFile = null) {
  // Match: CONSTANT_NAME (as word boundary)
  const pattern = new RegExp(String.raw`\b${escapeRegex(constantName)}\b`)

  for (const file of files) {
    // Skip the constants file itself
    if (excludeFile && file === excludeFile) {
      continue
    }

    try {
      let content = fs.readFileSync(file, 'utf-8')
      // Strip comments to avoid false positives
      content = stripComments(content)
      if (pattern.test(content)) {
        return true
      }
    } catch {
      continue
    }
  }

  return false
}

/**
 * Search for usage of a CSS class in the codebase
 */
function findCSSClassUsage(className, files, styleFile) {
  const escaped = escapeRegex(className)
  const patterns = [
    // Simple class attribute: class="classname" or class='classname'
    new RegExp(String.raw`class\s*=\s*["'][^"']*\b${escaped}\b[^"']*["']`),
    // Dynamic class binding with string: :class="classname" or :class='classname'
    new RegExp(String.raw`:class\s*=\s*["'][^"']*\b${escaped}\b[^"']*["']`),
    // Dynamic class binding with object: :class="{ 'classname': condition }" with quotes
    new RegExp(String.raw`:class\s*=\s*["']\{[^}]*['"]${escaped}['"][^}]*\}`),
    // Dynamic class binding with object: :class="{ classname: condition }" without quotes
    new RegExp(String.raw`:class\s*=\s*["']\{[^}]*\b${escaped}\b[^}]*\}`),
    // CSS @apply
    new RegExp(String.raw`@apply\s+.*\b${escaped}\b`),
    // Direct CSS reference: .classname
    new RegExp(String.raw`\.${escaped}\b`)
  ]

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8')

      // If this is the style file (Vue file), only search the template/script, not the style block
      if (file === styleFile) {
        // Remove the <style> block to avoid matching the class definition itself
        content = content.replaceAll(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      }

      // Strip comments to avoid false positives
      content = stripComments(content)

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return true
        }
      }
    } catch {
      continue
    }
  }

  return false
}

/**
 * Remove comments from code to avoid false positives
 */
function stripComments(content) {
  let result = content

  // Remove single-line comments (// ...)
  result = result.replaceAll(/\/\/.*$/gm, '')

  // Remove multi-line comments (/* ... */)
  result = result.replaceAll(/\/\*[\s\S]*?\*\//g, '')

  // Remove HTML comments (<!-- ... -->)
  result = result.replaceAll(/<!--[\s\S]*?-->/g, '')

  return result
}

/**
 * Search for usage of an exported function in the codebase
 */
function findFunctionUsage(functionName, files, sourceFile) {
  const escaped = escapeRegex(functionName)
  // Match function usage in any context (calls, callbacks, imports, etc)
  const patterns = [
    // Function call: functionName() or functionName ()
    new RegExp(String.raw`\b${escaped}\s*\(`),
    // Callback usage: functionName passed as argument (not followed by opening paren of that function)
    new RegExp(String.raw`[,([\s=]${escaped}(?=[,)\]\s;:])`),
    // Import/export reference
    new RegExp(String.raw`(?:import|export)\s*.*\b${escaped}\b`),
    // As property: .functionName
    new RegExp(String.raw`\.${escaped}\b`),
    // Generic word boundary match (catches any other usage as a standalone identifier)
    new RegExp(String.raw`\b${escaped}\b(?!\s*:)`) // Exclude object keys like { functionName: ... }
  ]

  // Pattern to match the function declaration (to exclude it from usage check)
  const declarationPattern = new RegExp(
    String.raw`^\s*export\s+(?:async\s+)?function\s+${escaped}\s*\(`,
    'm'
  )

  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8')
      // Strip comments to avoid false positives
      content = stripComments(content)

      // If this is the source file, remove the function declaration line
      if (file === sourceFile) {
        content = content.replace(declarationPattern, '')
      }

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return true
        }
      }
    } catch {
      continue
    }
  }

  return false
}

/**
 * Search for all usage of a key and return file paths
 */
function findKeyUsageFiles(key, files, searchType = 'translation') {
  let patterns = []

  if (searchType === 'translation') {
    const parts = key.split('.')
    const escapedKey = escapeRegex(key)
    const escapedParts = parts.map(p => escapeRegex(p))
    patterns = [
      new RegExp(String.raw`TEXT_DE\.${escapedKey}\b`),
      new RegExp(String.raw`TEXT_DE\['${escapedParts[0]}'\]\['${escapedParts[1]}'\]`),
      new RegExp(String.raw`TEXT_DE\['${escapedParts[0]}'\]\.${escapedParts[1]}`),
      new RegExp(String.raw`TEXT_DE\.${escapedParts[0]}\['${escapedParts[1]}'\]`)
    ]
  } else if (searchType === 'constant') {
    patterns = [new RegExp(String.raw`\b${escapeRegex(key)}\b`)]
  }

  const matchingFiles = []
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8')
      // Strip comments to avoid false positives
      content = stripComments(content)
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          matchingFiles.push(file)
          break
        }
      }
    } catch {
      continue
    }
  }

  return matchingFiles
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(`${message} (y/N): `, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y')
    })
  })
}

/**
 * Remove unused translation keys from TEXT_DE
 * Walks the file tracking brace nesting so it only removes the exact key
 * at the correct path (e.g. "shared.scoring.title" won't touch "shared.info.title").
 */
function cleanupTranslations(textFile, unusedKeys) {
  const unusedFullKeys = new Set(unusedKeys.map(k => k.fullKey))
  const lines = fs.readFileSync(textFile, 'utf-8').split('\n')
  const result = []
  const stack = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Track closing braces — pop nesting
    const closingMatch = trimmed.match(/^(\}[\s,]*)+$/)
    if (closingMatch) {
      const braceCount = (closingMatch[0].match(/\}/g) || []).length
      for (let i = 0; i < braceCount; i++) {
        stack.pop()
      }
      result.push(line)
      continue
    }

    // Empty object on one line — skip nesting
    if (/^(['"]?)(\w+)\1\s*:\s*\{\s*\},?$/.test(trimmed)) {
      result.push(line)
      continue
    }

    // Nested object opening — push onto stack
    const nestedMatch = trimmed.match(/^(['"]?)(\w+)\1\s*:\s*\{/)
    if (nestedMatch) {
      stack.push(nestedMatch[2])
      result.push(line)
      continue
    }

    // Leaf key — check if this exact full path is unused
    const leafMatch = trimmed.match(/^(['"]?)(\w+)\1\s*:/)
    if (leafMatch) {
      const fullKey = [...stack, leafMatch[2]].join('.')
      if (unusedFullKeys.has(fullKey)) {
        // Skip this line (remove it) and handle trailing comma on previous line
        continue
      }
    }

    result.push(line)
  }

  fs.writeFileSync(textFile, result.join('\n'), 'utf-8')
}

/**
 * Remove unused constants from constants file
 */
function cleanupConstants(constantsFile, unusedConstants) {
  let fileContent = fs.readFileSync(constantsFile, 'utf-8')

  for (const constant of unusedConstants) {
    // Remove the export const line: export const NAME = ...
    const pattern = new RegExp(String.raw`^export const ${escapeRegex(constant.key)}\s*=.*?$`, 'm')
    fileContent = fileContent.replace(pattern, '')
  }

  // Clean up multiple blank lines
  fileContent = fileContent.replaceAll(/\n\n\n+/g, '\n\n')

  fs.writeFileSync(constantsFile, fileContent, 'utf-8')
}

/**
 * Remove unused CSS classes
 */
function cleanupCSSClasses(styleFile, unusedClasses) {
  let fileContent = fs.readFileSync(styleFile, 'utf-8')

  for (const cssClass of unusedClasses) {
    // Remove the entire class definition: .classname { ... }
    const pattern = new RegExp(String.raw`\.${escapeRegex(cssClass.key)}\s*\{[^}]*\}`, 'g')
    fileContent = fileContent.replaceAll(pattern, '')
  }

  // Clean up multiple blank lines
  fileContent = fileContent.replaceAll(/\n\n\n+/g, '\n\n')

  fs.writeFileSync(styleFile, fileContent, 'utf-8')
}

/**
 * Print information
 */
function printInfo() {
  console.log(`
🔍 Scanning for unused translations, constants, styles, and functions...
`)
}

/**
 * Main function
 */
async function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(__dirname, '..')
  const textFile = path.join(projectRoot, 'packages/shared/src/text-de.ts')
  const constants1x1File = path.join(projectRoot, 'apps/1x1/src/constants.ts')
  const constantsDivFile = path.join(projectRoot, 'apps/div/src/constants.ts')
  const constantsEtaFile = path.join(projectRoot, 'apps/eta/src/constants.ts')
  const constantsLwkFile = path.join(projectRoot, 'apps/lwk/src/constants.ts')
  const constantsPumFile = path.join(projectRoot, 'apps/pum/src/constants.ts')
  const constantsVocFile = path.join(projectRoot, 'apps/voc/src/constants.ts')
  const sourceDir = projectRoot

  printInfo()

  // Parse .gitignore and use its patterns
  const gitignorePatterns = parseGitignore(path.join(projectRoot, '.gitignore'))
  const allFiles = findFiles(sourceDir, ['ts', 'vue', 'js', 'md', 'html', 'css', 'scss'], gitignorePatterns)
  // Exclude test files from scanning
  const files = allFiles.filter(file => !file.endsWith('.spec.ts'))
  console.log(
    `📂 Scanning ${files.length} files (excluded ${allFiles.length - files.length} test files)...\n`
  )

  // ============================================
  // TRANSLATIONS
  // ============================================
  let allAssets = []
  let usedCount = 0
  let unusedCount = 0

  console.log('🔍 Checking translations...')
  if (fs.existsSync(textFile)) {
    const fileContent = fs.readFileSync(textFile, 'utf-8')
    const textDeMatch = fileContent.match(/export const TEXT_DE = \{([\s\S]*?)\} as const/)

    if (textDeMatch) {
      try {
        const keys = extractTranslationKeysFromSource(textDeMatch[1])
        console.log(`  ✅ Found ${keys.length} translation keys`)

        for (const key of keys) {
          const isUsed = findKeyUsage(key.fullKey, files)
          if (isUsed) {
            usedCount++
          } else {
            allAssets.push(key)
          }
        }
      } catch (error) {
        console.error('❌ Error parsing TEXT_DE object:', error.message)
      }
    } else {
      console.error('❌ Could not parse TEXT_DE object')
    }
  } else {
    console.error(`❌ Text file not found: ${textFile}`)
  }

  // ============================================
  // CONSTANTS
  // ============================================
  console.log('🔍 Checking constants...')

  for (const [appName, constantsFile] of [
    ['1x1', constants1x1File],
    ['div', constantsDivFile],
    ['eta', constantsEtaFile],
    ['lwk', constantsLwkFile],
    ['pum', constantsPumFile],
    ['voc', constantsVocFile],
  ]) {
    if (fs.existsSync(constantsFile)) {
      const constants = extractConstants(constantsFile, appName)
      console.log(`  ✅ Found ${constants.length} constants in ${appName}`)

      for (const constant of constants) {
        const isUsed = findConstantUsage(constant.key, files, constantsFile)
        if (isUsed) {
          usedCount++
        } else {
          allAssets.push(constant)
        }
      }
    }
  }

  // ============================================
  // CSS CLASSES
  // ============================================
  console.log('🔍 Checking CSS classes...')
  const cssClasses = extractCSSClasses(sourceDir, gitignorePatterns)
  console.log(`  ✅ Found ${cssClasses.length} CSS classes`)

  for (const cssClass of cssClasses) {
    const isUsed = findCSSClassUsage(cssClass.key, files, cssClass.file)
    if (isUsed) {
      usedCount++
    } else {
      allAssets.push(cssClass)
    }
  }

  // ============================================
  // EXPORTED FUNCTIONS
  // ============================================
  console.log('🔍 Checking exported functions...')
  const functions = extractExportedFunctions(sourceDir, gitignorePatterns)
  console.log(`  ✅ Found ${functions.length} exported functions\n`)

  for (const func of functions) {
    const isUsed = findFunctionUsage(func.key, files, func.file)
    if (isUsed) {
      usedCount++
    } else {
      allAssets.push(func)
    }
  }

  // ============================================
  // RESULTS
  // ============================================
  unusedCount = allAssets.length

  if (unusedCount === 0) {
    console.log('✅ All assets are being used!')
  } else {
    console.log(`⚠️  Found ${unusedCount} unused assets:\n`)
    console.log('-------------------------------------------')

    // Group by type
    const assetsByType = {}
    for (const asset of allAssets) {
      if (!assetsByType[asset.type]) {
        assetsByType[asset.type] = []
      }
      assetsByType[asset.type].push(asset)
    }

    const typeDisplayNames = {
      translation: 'Translations',
      constant: 'Constants',
      cssclass: 'CSS Classes',
      function: 'Exported Functions'
    }

    const typeOrder = ['translation', 'constant', 'cssclass', 'function']
    for (const type of typeOrder) {
      if (!assetsByType[type]) continue

      console.log(`\n${typeDisplayNames[type]}:`)

      const sortedAssets = assetsByType[type].sort((a, b) => a.fullKey.localeCompare(b.fullKey))

      for (const asset of sortedAssets) {
        let prefix = ''
        if (asset.type === 'translation') {
          prefix = 'TEXT_DE.'
        } else if (asset.type === 'constant') {
          prefix = `[${asset.app}] `
        } else if (asset.type === 'cssclass') {
          prefix = '.'
        } else if (asset.type === 'function') {
          prefix = '👁️ '
        }

        console.log(`  ${prefix}${asset.fullKey}`)
      }
    }

    console.log('\n-------------------------------------------')

    if (assetsByType['translation']) {
      console.log(`\n  Translations: ${assetsByType['translation'].length} unused`)
    }
    if (assetsByType['constant']) {
      console.log(`  Constants: ${assetsByType['constant'].length} unused`)
    }
    if (assetsByType['cssclass']) {
      console.log(`  CSS classes: ${assetsByType['cssclass'].length} unused`)
    }
    if (assetsByType['function']) {
      console.log(`  Exported functions: ${assetsByType['function'].length} unused (ℹ️ view-only)`)
    }

    // ============================================
    // PROMPT FOR CLEANUP
    // ============================================
    console.log('\n-------------------------------------------')

    const shouldCleanup = await promptConfirmation(
      '\n❓ Do you want to clean up these unused assets?'
    )

    if (shouldCleanup) {
      console.log('\n🧹 Cleaning up...\n')
      console.log('The following assets will be REMOVED:\n')

      // Only cleanup these types - functions are view-only
      const typeOrder = ['translation', 'constant', 'cssclass']
      for (const type of typeOrder) {
        if (!assetsByType[type]) continue
        console.log(`${typeDisplayNames[type]}: ${assetsByType[type].length}`)
        for (const asset of assetsByType[type].slice(0, 3)) {
          let prefix = ''
          if (asset.type === 'translation') {
            prefix = 'TEXT_DE.'
          } else if (asset.type === 'constant') {
            prefix = `[${asset.app}] `
          } else if (asset.type === 'cssclass') {
            prefix = '.'
          }
          console.log(`  • ${prefix}${asset.fullKey}`)
        }
        if (assetsByType[type].length > 3) {
          console.log(`  ... and ${assetsByType[type].length - 3} more`)
        }
      }

      if (assetsByType['function']) {
        console.log(
          `\n⚠️  ${assetsByType['function'].length} unused functions found (view-only - not cleaned up)`
        )
      }

      // Cleanup translations
      if (assetsByType['translation']) {
        try {
          cleanupTranslations(textFile, assetsByType['translation'])
          console.log(`✅ Removed ${assetsByType['translation'].length} translation keys`)
        } catch (error) {
          console.error(`❌ Error cleaning up translations: ${error.message}`)
        }
      }

      // Cleanup constants
      const constantsByFile = {}
      if (assetsByType['constant']) {
        for (const constant of assetsByType['constant']) {
          if (!constantsByFile[constant.file]) {
            constantsByFile[constant.file] = []
          }
          constantsByFile[constant.file].push(constant)
        }

        for (const [file, constants] of Object.entries(constantsByFile)) {
          try {
            cleanupConstants(file, constants)
            console.log(
              `✅ Removed ${constants.length} constants from ${path.relative(projectRoot, file)}`
            )
          } catch (error) {
            console.error(`❌ Error cleaning up constants: ${error.message}`)
          }
        }
      }

      // Cleanup CSS classes
      const cssClassesByFile = {}
      if (assetsByType['cssclass']) {
        for (const cssClass of assetsByType['cssclass']) {
          if (!cssClassesByFile[cssClass.file]) {
            cssClassesByFile[cssClass.file] = []
          }
          cssClassesByFile[cssClass.file].push(cssClass)
        }

        for (const [file, classes] of Object.entries(cssClassesByFile)) {
          try {
            cleanupCSSClasses(file, classes)
            console.log(
              `✅ Removed ${classes.length} CSS classes from ${path.relative(projectRoot, file)}`
            )
          } catch (error) {
            console.error(`❌ Error cleaning up CSS classes: ${error.message}`)
          }
        }
      }

      console.log('\n🎉 Cleanup complete!')
    } else {
      console.log('\n❌ Cleanup cancelled.')
    }
  }
}

await main()
