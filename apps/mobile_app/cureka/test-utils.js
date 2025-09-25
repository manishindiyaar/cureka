// Simple test runner for unit tests without Jest/Mocha
// Following the pattern from apps/api/sara_tests/

class SimpleTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.currentSuite = '';
    this.results = [];
  }

  describe(suiteName, fn) {
    this.currentSuite = suiteName;
    console.log(`\n📦 ${suiteName}`);
    fn();
    this.currentSuite = '';
  }

  it(testName, fn) {
    try {
      fn();
      this.passed++;
      console.log(`  ✅ ${testName}`);
      this.results.push({ suite: this.currentSuite, test: testName, passed: true });
    } catch (error) {
      this.failed++;
      console.log(`  ❌ ${testName}`);
      console.log(`     Error: ${error.message}`);
      this.results.push({ suite: this.currentSuite, test: testName, passed: false, error: error.message });
    }
  }

  expect(actual) {
    return {
      toBe(expected) {
        if (actual!== expected) {
          throw new Error(`Expected ${expected} but got ${actual}`);
        }
      },
      toEqual(expected) {
        if (typeof expected === 'object') {
          if (JSON.stringify(actual)!== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
          }
        } else {
          if (actual!== expected) throw new Error(`Expected ${expected} but got ${actual}`);
        }
      },
      toBeTruthy() {
        if (!actual) throw new Error(`Expected truthy value but got ${actual}`);
      },
      toBeFalsy() {
        if (actual) throw new Error(`Expected falsy value but got ${actual}`);
      },
      toThrow(expected) {
        try {
          actual();
          throw new Error(`Expected function to throw but it didn't`);
        } catch (error) {
          if (typeof expected === 'string' && !error.message.includes(expected)) {
            throw new Error(`Expected error containing "${expected}" but got "${error.message}"`);
          }
        }
      },
      toBeDefined() {
        if (actual === undefined) throw new Error(`Expected defined value but got undefined`);
      },
      toBeUndefined() {
        if (actual!== undefined) throw new Error(`Expected undefined but got ${actual}`);
      },
      toBeNull() {
        if (actual!== null) throw new Error(`Expected null but got ${actual}`);
      },
      toHaveBeenCalled() {
        if (!actual.mock) throw new Error('Expected a mocked function');
        if (actual.mock.calls.length === 0) throw new Error('Function was not called');
      },
      toHaveBeenCalledWith(...args) {
        if (!actual.mock) throw new Error('Expected a mocked function');
        const lastCall = actual.mock.calls[actual.mock.calls.length - 1];
        if (JSON.stringify(lastCall)!== JSON.stringify(args)) {
          throw new Error(`Expected to be called with ${JSON.stringify(args)} but was called with ${JSON.stringify(lastCall)}`);
        }
      }
    };
  }

  jest = {
    fn: (impl) => {
      const mockFn = (...args) => {
        mockFn.mock.calls.push(args);
        if (impl) return impl(...args);
        return arg;
      };
      mockFn.mock = { calls: [] };
      mockFn.mockClear = () => { mockFn.mock.calls = []; };
      return mockFn;
    },
    clearAllMocks: () => {
      // Clean up all mocks
    }
  };

  finish() {
    console.log('\n' + '='.repeat(40));
    console.log(`Test Results: ${this.passed} passed, ${this.failed} failed`);
    if (this.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`⚠️  ${this.failed} test(s) failed`);
      process.exit(1);
    }
    console.log('='.repeat(40));
    return { passed: this.passed, failed: this.failed, results: this.results };
  }
}

module.exports = SimpleTestRunner;