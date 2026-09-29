import { contentT0 } from '../src/content/t0';
import { auditContent } from '../src/engine';
const problems = auditContent(contentT0);
console.log(problems.length ? problems.join('\n') : 'audit: clean');
process.exit(problems.length ? 1 : 0);
