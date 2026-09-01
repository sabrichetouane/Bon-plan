// Verification pass: parse every source file, check relative imports resolve,
// and cross-check every t('...') key against src/i18n.js.
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

process.chdir(require('path').resolve(__dirname, '..'));

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) files.push(p.split(path.sep).join('/'));
  }
})('src');
files.push('App.js');

// ---- 1. does everything parse? ----
let bad = 0;
for (const f of files) {
  try {
    babel.transformSync(fs.readFileSync(f, 'utf8'), {
      filename: f,
      presets: ['babel-preset-expo'],
      babelrc: false,
      configFile: false,
    });
  } catch (e) {
    bad++;
    console.log('PARSE FAIL  ' + f + '  ::  ' + e.message.split('\n')[0]);
  }
}
console.log('[1] parsed ' + files.length + ' files -> ' + (bad === 0 ? 'ALL CLEAN' : bad + ' FAILURES'));

// ---- 2. do all relative imports point at real files? ----
let missing = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) {
    const spec = m[1];
    const base = path.resolve(path.dirname(f), spec);
    const candidates = [base, base + '.js', base + '.jsx', path.join(base, 'index.js')];
    if (!candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile())) {
      missing++;
      console.log('MISSING IMPORT  ' + f + '  ->  ' + spec);
    }
  }
}
console.log('[2] relative imports -> ' + (missing === 0 ? 'ALL RESOLVE' : missing + ' BROKEN'));

// ---- 3. every t('key') must exist in i18n.js ----
const i18n = fs.readFileSync('src/i18n.js', 'utf8');
const defined = new Set();
for (const m of i18n.matchAll(/^\s{2}'([a-zA-Z]+\.[a-zA-Z0-9]+)':/gm)) defined.add(m[1]);

const used = new Map(); // key -> the files that use it
for (const f of files) {
  if (f.endsWith('i18n.js')) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z]+\.[a-zA-Z0-9]+)'\s*\)/g)) {
    if (!used.has(m[1])) used.set(m[1], []);
    used.get(m[1]).push(f);
  }
}

const undefinedKeys = [...used.keys()].filter((k) => !defined.has(k));
console.log('[3] i18n: ' + defined.size + ' defined, ' + used.size + ' used statically');
if (undefinedKeys.length) {
  for (const k of undefinedKeys) console.log('   UNDEFINED KEY  ' + k + '   used in ' + used.get(k).join(', '));
} else {
  console.log('   every static t() key exists');
}

// ---- 4. anti-pattern sweep on the screens ----
console.log('[4] anti-pattern sweep:');
const patterns = [
  [/from 'react-native';[\s\S]{0,400}?SafeAreaView/, 'SafeAreaView still imported from react-native'],
  [/Dimensions\.get\(/, 'module-scope Dimensions.get'],
  [/^const styles = StyleSheet\.create/m, 'module-level StyleSheet.create (should be makeStyles)'],
];
let hits = 0;
for (const f of files) {
  if (!f.includes('/screens/') && !f.includes('/components/')) continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const [re, label] of patterns) {
    if (re.test(src)) {
      // SplashScreen is allowed a module-level StyleSheet: it is always blue
      // and never reads the theme.
      if (label.startsWith('module-level') && f.endsWith('SplashScreen.js')) continue;
      hits++;
      console.log('   ' + label + '  ->  ' + f);
    }
  }
}
if (hits === 0) console.log('   clean');
