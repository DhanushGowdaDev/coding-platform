import React, { useState, useEffect } from 'react';
import { UnControlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import detectDevTools from 'devtools-detect';
import './App.css';
import Timer from './Timer';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [violations, setViolations] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [code, setCode] = useState(`// Write your solution here
function twoSum(nums, target) {
  // Your code here
}`);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [currentProblem, setCurrentProblem] = useState(0);
  const [submissions, setSubmissions] = useState({});
  const problems = [
    {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists.'
      ],
      sampleInput: 'nums = [2,7,11,15], target = 9',
      sampleOutput: '[0,1]',
      testCases: [
        { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
        { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' },
        { stdin: '2 7 11 15\n9', expected: '0 1' },
        { stdin: '3 2 4\n6', expected: '1 2' }
      ],
      templates: {
        javascript: `function twoSum(nums, target) {
  // Your code here
}`,
        python: `def two_sum(nums, target):
    # Your code here
    pass`,
        c: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    return result;
}`,
        cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
    }
};`,
        java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`
      },
      runner: (func, test) => {
        const nums = JSON.parse(test.input.match(/nums = (\[.*\])/)[1]);
        const target = JSON.parse(test.input.match(/target = (\d+)/)[1]);
        return func(nums, target);
      }
    },
    {
      title: 'Reverse String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters s.',
      constraints: [
        '1 <= s.length <= 10^5',
        's[i] is a printable ascii character.'
      ],
      sampleInput: 's = ["h","e","l","l","o"]',
      sampleOutput: '["o","l","l","e","h"]',
      testCases: [
        { input: 's = ["h","e","l","l","o"]', expected: '["o","l","l","e","h"]' },
        { stdin: 'h e l l o', expected: 'o l l e h' }
      ],
      templates: {
        javascript: `function reverseString(s) {
  // Your code here
}`,
        python: `def reverse_string(s):
    # Your code here
    pass`,
        c: `#include <stdio.h>
#include <string.h>

void reverseString(char* s, int sSize) {
    // Your code here
}`,
        cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    void reverseString(vector<char>& s) {
        // Your code here
    }
};`,
        java: `public class Solution {
    public void reverseString(char[] s) {
        // Your code here
    }
}`
      },
      runner: (func, test) => {
        const s = JSON.parse(test.input.match(/s = (\[.*\])/)[1]);
        func(s); // modifies in place
        return s;
      }
    }
  ];
  const problem = problems[currentProblem];

  useEffect(() => {
    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolations(prev => prev + 1);
        alert('Tab switching detected! This is a violation.');
      }
    };

    // Prevent right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      setViolations(prev => prev + 1);
      alert('Right-click disabled!');
    };

    // Prevent copy-paste globally
    const handleCopyPaste = (e) => {
      e.preventDefault();
      setViolations(prev => prev + 1);
      alert('Copy-paste disabled!');
    };

    // Dev tools detection
    // devtools.on('open', () => {
    //   setViolations(prev => prev + 1);
    //   alert('Developer tools detected! This is a violation.');
    // });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      // devtools.off('open');
    };
  }, []);

  useEffect(() => {
    if (currentView === 'editor' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView, timeLeft]);

  useEffect(() => {
    if (currentView === 'editor' && problem.templates && problem.templates[language]) {
      setCode(problem.templates[language]);
    }

  }, [language, currentProblem, currentView]);


  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Define a dynamic base URL for API calls
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

  const formatResults = (results) => {
    if (!results || results.length === 0) return 'No results';
    const lines = [];
    results.forEach((r, idx) => {
      lines.push(`Test ${idx + 1}: ${r.passed ? 'Passed' : 'Failed'}`);
      const out = r.stdout ?? r.output ?? r.out ?? '';
      const err = r.stderr ?? r.error ?? r.compileError ?? '';
      if (out && String(out).trim().length) lines.push(`  stdout: ${String(out).trim()}`);
      if (err && String(err).trim()) lines.push(`  stderr/error: ${String(err).trim()}`);
      if (r.timeMs !== undefined && r.timeMs !== null) lines.push(`  time: ${r.timeMs} ms`);
      if (r.exitCode !== undefined && r.exitCode !== null) lines.push(`  exit code: ${r.exitCode}`);
      lines.push('');
    });
    return lines.join('\n');
  };

  // Update runCode function to use dynamic base URL
  const runCode = async () => {
    try {
      const funcName = (function extractFuncName(code, language) {
        try {
          if (language === 'python') {
            const m = code.match(/def\s+([A-Za-z0-9_]+)\s*\(/);
            return m ? m[1] : null;
          }
          if (language === 'javascript') {
            const m = code.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
            return m ? m[1] : null;
          }
          if (language === 'java') {
            const m = code.match(/(?:public|private|protected)?\s+static\s+[A-Za-z0-9_<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(/);
            return m ? m[1] : null;
          }
          if (language === 'c' || language === 'cpp') {
            const m = code.match(/([A-Za-z0-9_]+)\s*\([^;\)]*\)\s*\{/);
            return m ? m[1] : null;
          }
          return null;
        } catch (e) { return null; }
      })(code, language);

      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
          funcName,
          tests: problems[currentProblem].testCases,
          timeLimitMs: 2000,
          memoryLimitMb: 256
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        setOutput(`Runner error: ${data.error}`);
      } else {
        // show compile/runtime errors prominently (compileError, error, or stderr)
        const results = data.results || [];
        const errRes = results.find(r => r && (r.compileError || r.error || (r.stderr && String(r.stderr).trim().length > 0)));
        if (errRes) {
          const msg = errRes.compileError || errRes.error || errRes.stderr;
          setOutput(`Error:\n${msg}`);
        } else {
          setOutput(formatResults(results));
        }
      }
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    }
  };

  // Update submitCode function to use dynamic base URL
  const submitCode = async () => {
    setOutput('Submitting...');
    const buildTests = () => {
      const tests = [];
      for (const tc of problem.testCases) {
        if (tc.stdin) {
          tests.push({ input: tc.stdin, expected: tc.expected });
        } else {
          const input = tc.input || '';
          const args = [];
          const arrMatch = input.match(/(\[.*\])/);
          if (arrMatch) {
            try {
              args.push(JSON.parse(arrMatch[1]));
            } catch (e) {
              args.push(arrMatch[1]);
            }
          }
          const numMatch = input.match(/target\s*=\s*([\-]?[0-9]+)/);
          if (numMatch) args.push(Number(numMatch[1]));
          if (args.length === 0 && input.length) args.push(input);
          tests.push({ args, expected: tc.expected });
        }
      }
      return tests;
    };

    const funcName = (function extractFuncName(code, language) {
      try {
        if (language === 'python') {
          const m = code.match(/def\s+([A-Za-z0-9_]+)\s*\(/);
          return m ? m[1] : null;
        }
        if (language === 'javascript') {
          const m = code.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
          return m ? m[1] : null;
        }
        if (language === 'java') {
          const m = code.match(/(?:public|private|protected)?\s+static\s+[A-Za-z0-9_<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(/);
          return m ? m[1] : null;
        }
        if (language === 'c' || language === 'cpp') {
          const m = code.match(/([A-Za-z0-9_]+)\s*\([^;\)]*\)\s*\{/);
          return m ? m[1] : null;
        }
        return null;
      } catch (e) { return null; }
    })(code, language);

    const prepared = buildTests();
    try {
      const resp = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, funcName, tests: prepared }),
      });

      if (!resp.ok) {
        throw new Error(`Server error: ${resp.statusText}`);
      }

      const data = await resp.json();
      if (data.error) {
        setOutput(`Runner error: ${data.error}`);
        return;
      }

      const results = data.results || [];
      // If any result has compile/runtime stderr or compileError, show it first
      const errRes = results.find(r => r && (r.compileError || r.error || (r.stderr && String(r.stderr).trim().length > 0)));
      if (errRes) {
        const msg = errRes.compileError || errRes.error || errRes.stderr;
        setOutput(`Error:\n${msg}`);
        return;
      }

      const passedCount = results.filter(r => r.passed).length;
      const score = Math.round((passedCount / (prepared.length || 1)) * 100);

      const submitResp = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: currentProblem, language, code, score }),
      });

      if (!submitResp.ok) {
        throw new Error(`Server error: ${submitResp.statusText}`);
      }

      const submitData = await submitResp.json();
      if (submitData.error) {
        setOutput(`Submit error: ${submitData.error}`);
      } else {
        // Show runner results followed by submission confirmation
        const resultsText = formatResults(results || []);
        setOutput(`${resultsText}\nSubmitted! Score: ${score}% (${passedCount}/${prepared.length}) - id ${submitData.id}`);
      }
    } catch (e) {
      setOutput(`Network/submit error: ${e.message}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Coding Competition Platform</h1>
        <div className="nav">
          <button onClick={() => setCurrentView('home')}>Home</button>
          <button onClick={() => setCurrentView('contests')}>Contests</button>
          <button onClick={() => setCurrentView('submissions')}>My Submissions</button>
          {currentView === 'editor' && <Timer timeLeft={timeLeft} />}
          {violations > 0 && <span className="violations">Violations: {violations}</span>}
          {!isFullscreen && <button onClick={enterFullscreen}>Enter Fullscreen</button>}
          {isFullscreen && <button onClick={exitFullscreen}>Exit Fullscreen</button>}
        </div>
      </header>
      <main>
        {currentView === 'home' && (
          <section className="home">
            <h2>Welcome to the Coding Competition Platform</h2>
            <p>This platform prevents tab switching and copy-paste for fair competitions.</p>
            <p>Violations detected: {violations}</p>
          </section>
        )}
        {currentView === 'contests' && (
          <section className="contests">
            <h2>Available Contests</h2>
            <ul>
              <li onClick={() => setCurrentView('problems')}>Sample Contest 1</li>
              <li>Sample Contest 2 (Coming Soon)</li>
            </ul>
          </section>
        )}
        {currentView === 'problems' && (
          <section className="problems">
            <h2>Problems</h2>
            <ul>
              {problems.map((p, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="problem-select-button"
                    onClick={() => {
                      setCurrentProblem(i);
                      setCurrentView('editor');
                      setCode(p.templates[language] || '// Template not available');
                    }}
                  >
                    {p.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {currentView === 'editor' && (
          <section className="editor">
            <div className="problem-statement">
              <h2>{problem.title}</h2>
              <p>{problem.description}</p>
              <h3>Constraints:</h3>
              <ul>
                {problem.constraints.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              <h3>Sample Input:</h3>
              <pre>{problem.sampleInput}</pre>
              <h3>Sample Output:</h3>
              <pre>{problem.sampleOutput}</pre>
            </div>
            <div className="code-section">
              <div className="code-header">
                <div>
                  <button onClick={() => setCurrentProblem(Math.max(0, currentProblem - 1))}>Prev</button>
                  <span>Problem {currentProblem + 1} of {problems.length}</span>
                  <button onClick={() => setCurrentProblem(Math.min(problems.length - 1, currentProblem + 1))}>Next</button>
                </div>
                <label htmlFor="language-select">Programming language</label>

                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>
                <button onClick={runCode}>Run Code</button>
                <button onClick={submitCode}>Submit</button>
              </div>
              <div className="code-editor-container">
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <CodeMirror
                    value={code}
                    options={{
                      mode: language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'clike',
                      theme: 'default',
                      lineNumbers: true,
                      readOnly: false,
                      tabSize: 2,
                      indentWithTabs: false,
                    }}
                    onChange={(editor, data, value) => {
                      setCode(value);
                    }}
                    onKeyDown={(editor, event) => {
                      if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x'].includes(event.key.toLowerCase())) {
                        event.preventDefault();
                        setViolations(prev => prev + 1);
                        alert('Copy-paste disabled!');
                      }
                    }}
                  />
                  <div className="output">
                    <h3>Output:</h3>
                    <pre>{output}</pre>
                  </div>
                </div>
                <div className="test-cases-section">
                  <h3>Test Cases:</h3>
                  <div className="test-cases-list">
                    {problem.testCases.map((tc, index) => (
                      <div key={index} className="test-case">
                        <div className="test-case-header">
                          <strong>Test Case {index + 1}:</strong>
                          {tc.stdin ? <span> (Stdin Input)</span> : <span> (Function Args)</span>}
                        </div>
                        <div className="test-case-content">
                          {tc.stdin ? (
                            <div>
                              <div><strong>Input:</strong> {tc.stdin.split('\n').map((line, i) => <div key={i}>{line}</div>)}</div>
                            </div>
                          ) : (
                            <div>
                              <div><strong>Input:</strong> {tc.input}</div>
                            </div>
                          )}
                          <div><strong>Expected:</strong> {JSON.stringify(tc.expected)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {currentView === 'submissions' && (
          <section className="submissions">
            <h2>My Submissions</h2>
            {Object.keys(submissions).length === 0 ? (
              <p>No submissions yet.</p>
            ) : (
              <ul>
                {Object.entries(submissions).map(([idx, sub]) => (
                  <li key={idx}>
                    <strong>{problems[parseInt(idx)].title}</strong>: {sub.score}%
                    <details>
                      <summary>Code</summary>
                      <pre>{sub.code}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}



export default App;