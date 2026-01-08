import * as path from 'path';
import moduleAlias from 'module-alias';

moduleAlias.addAliases({
  '@config': path.join(__dirname, 'config'),
  '@common': path.join(__dirname, 'common'),
  '@core': path.join(__dirname, 'core'),
  '@modules': path.join(__dirname, 'modules'),
  '@middleware': path.join(__dirname, 'middleware'),
});
