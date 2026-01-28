# Security Test Suite

This directory contains comprehensive security-focused tests for the Oil & Gas platform backend.

## Test Files

### 1. `injection-attacks.spec.ts`
Tests for various injection attack vectors:
- **SQL Injection**: Tests protection against SQL injection in queries, parameters, and body
- **XSS (Cross-Site Scripting)**: Tests XSS payload sanitization
- **Command Injection**: Tests protection against command injection
- **NoSQL Injection**: Tests protection against NoSQL injection
- **LDAP Injection**: Tests LDAP injection protection
- **Path Traversal**: Tests protection against directory traversal attacks

### 2. `authentication-bypass.spec.ts`
Tests for authentication bypass attempts:
- **JWT Token Manipulation**: Invalid, expired, tampered tokens
- **Authorization Header Manipulation**: Malformed headers, multiple headers
- **Session Fixation**: Token in query params, body
- **Brute Force Protection**: Multiple failed login attempts
- **Token Replay**: Token freshness validation
- **Case Sensitivity**: Header case variations

### 3. `authorization-bypass.spec.ts`
Tests for authorization bypass and privilege escalation:
- **Role-Based Access Control**: Compliance, AssetManager, Principal, Manager role checks
- **Privilege Escalation**: Modified role claims, organization membership
- **IDOR (Insecure Direct Object Reference)**: Access to other users/organizations resources
- **Missing Authorization**: Protected endpoint access without auth
- **Role Enumeration**: Error messages don't reveal valid roles
- **Token Reuse**: Token context validation

### 4. `input-validation.spec.ts`
Tests for input validation security:
- **Type Validation**: Invalid types, wrong data types
- **Required Field Validation**: Missing required fields, empty strings
- **Length Validation**: Maximum length enforcement
- **Format Validation**: Email, UUID, URL format validation
- **Enum Validation**: Invalid enum values
- **Whitelist Validation**: Extra properties rejection
- **Nested Object Validation**: Nested object validation
- **Array Validation**: Array type and element validation
- **Special Characters**: Null bytes, control characters

### 5. `security-headers.spec.ts`
Tests for security headers:
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection
- **X-XSS-Protection**: XSS protection
- **Referrer-Policy**: Referrer information control
- **Content-Security-Policy**: CSP header validation

## Running Tests

### Run All Security Tests
```bash
cd backend/og-backend
pnpm test tests/security
```

### Run Specific Test File
```bash
# Injection attacks
pnpm test injection-attacks

# Authentication bypass
pnpm test authentication-bypass

# Authorization bypass
pnpm test authorization-bypass

# Input validation
pnpm test input-validation

# Security headers
pnpm test security-headers
```

### Run with Coverage
```bash
pnpm test:cov tests/security
```

## Test Coverage

These tests cover:
- ✅ Injection attacks (SQL, XSS, command, NoSQL, LDAP, path traversal)
- ✅ Authentication bypass attempts
- ✅ Authorization bypass and privilege escalation
- ✅ Input validation and sanitization
- ✅ Security headers
- ✅ IDOR protection
- ✅ Role-based access control

## Adding New Tests

When adding new security tests:

1. **Follow naming convention**: `*.spec.ts`
2. **Use descriptive test names**: Clearly describe what security issue is being tested
3. **Test both positive and negative cases**: Verify both rejection of bad input and acceptance of good input
4. **Use realistic attack payloads**: Use actual attack vectors from OWASP Top 10
5. **Document test purpose**: Add comments explaining why the test is important

## Integration with CI/CD

These tests run automatically:
- On every pull request
- As part of the test suite in CI/CD
- Before deployment (blocking if tests fail)

## Security Test Best Practices

1. **Test Real Attack Vectors**: Use actual attack payloads from security advisories
2. **Test Edge Cases**: Test boundary conditions, null values, empty strings
3. **Test Error Handling**: Verify error messages don't leak sensitive information
4. **Test Rate Limiting**: Verify brute force protection
5. **Test Token Validation**: Verify JWT validation is strict
6. **Test Input Sanitization**: Verify all inputs are validated and sanitized
7. **Test Authorization**: Verify role-based access control works correctly

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

