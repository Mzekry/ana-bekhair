const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfile = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      if (fs.existsSync(podfile)) {
        let contents = fs.readFileSync(podfile, 'utf8');
        // Inject use_modular_headers! right after the target definition
        if (!contents.includes('use_modular_headers!')) {
          contents = contents.replace(
            /target\s+('|")[^'"]+('|")\s+do/,
            match => `${match}\n  use_modular_headers!`
          );
          fs.writeFileSync(podfile, contents);
        }
      }
      return config;
    },
  ]);
};
