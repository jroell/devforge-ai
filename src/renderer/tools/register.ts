// Import each tool module here to trigger self-registration.

// Phase 1: Formatters
import './formatters/json-formatter'

// Phase 1: Encoders
import './encoders/base64'
import './encoders/jwt-debugger'
import './encoders/url-encoder'

// Phase 1: Converters, Generators, Inspectors
import './converters/unix-timestamp'
import './generators/hash-generator'
import './generators/uuid-generator'
import './inspectors/regex-tester'
