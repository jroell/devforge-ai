// Import each tool module here to trigger self-registration.

// Phase 1 + Phase 3: Formatters
import './formatters/json-formatter'
import './formatters/xml-formatter'
import './formatters/html-formatter'
import './formatters/css-formatter'
import './formatters/js-formatter'
import './formatters/sql-formatter'
import './formatters/yaml-formatter'

// Phase 1: Encoders
import './encoders/base64'
import './encoders/jwt-debugger'
import './encoders/url-encoder'

// Phase 1: Converters, Generators, Inspectors
import './converters/unix-timestamp'
import './generators/hash-generator'
import './generators/uuid-generator'
import './inspectors/regex-tester'
import './inspectors/cron-parser'

// AI Tools
import './ai/code-generator'
import './ai/magic-transform'
import './ai/log-analyzer'

// Generators (AI-powered)
import './generators/mock-data-generator'

// Phase 3: Encoders
import './encoders/html-entities'
import './encoders/hex-ascii'

// Phase 3: Converters
import './converters/json-yaml'
import './converters/number-base'
import './converters/text-case'
import './converters/json-csv'

// Phase 3: Generators
import './generators/password-generator'

// Phase 3: Inspectors
import './inspectors/diff-checker'
import './inspectors/text-inspector'
import './inspectors/markdown-viewer'
