        mermaid.initialize({ startOnLoad: true });

        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.getElementById(tabName).classList.add('active');
            document.querySelector(`button[onclick="showTab('${tabName}')"]`).classList.add('active');
        }


        document.querySelector(".cls").addEventListener('click', function(){
            location.reload()
        });


        function generateTable() {
            const variables = parseInt(document.getElementById('variables').value);
            if (variables < 1 || variables > 16) {
                alert('Please enter a number between 1 and 16');
                return;
            }

            const rows = Math.pow(2, variables);
            let tableHTML = '<table><thead><tr>';
            
            for (let i = 0; i < variables; i++) {
                tableHTML += `<th>${String.fromCharCode(65 + i)}</th>`;
            }
            tableHTML += '<th>Output</th></tr></thead><tbody>';

            for (let i = 0; i < rows; i++) {
                tableHTML += '<tr>';
                for (let j = variables - 1; j >= 0; j--) {
                    const value = (i >> j) & 1;
                    tableHTML += `<td>${value}</td>`;
                }
                tableHTML += '<td><select class="output-select"><option value="0">0</option><option value="1">1</option></select></td></tr>';
            }
            
            tableHTML += '</tbody></table>';
            tableHTML += '<button onclick="analyzeTable()">Analyze Table</button>';
            
            document.getElementById('tableContainer').innerHTML = tableHTML;
            document.getElementById('expressionContainer').innerHTML = '';
            document.getElementById('circuitDiagram').innerHTML = '';
            document.getElementById('validatorContainer').innerHTML = '';
        }

        function analyzeTable() {
            const variables = parseInt(document.getElementById('variables').value);
            const outputs = Array.from(document.getElementsByClassName('output-select')).map(select => select.value);
            
            const sop = generateSOP(variables, outputs);
            const pos = generatePOS(variables, outputs);
            const simplified = simplifyExpression(variables, outputs);
            
            document.getElementById('expressionContainer').innerHTML = `
                <h3>Logical Expressions:</h3>
                <p><strong>Sum of Products (SOP):</strong> F = ${sop}</p>
                <p><strong>Product of Sums (POS):</strong> F = ${pos}</p>
                <p><strong>Simplified Expression:</strong> F = ${simplified}</p>
            `;

            generateCircuitDiagram(simplified);
        }

        function generateSOP(variables, outputs) {
            const terms = [];
            outputs.forEach((output, index) => {
                if (output === '1') {
                    let term = '';
                    for (let j = variables - 1; j >= 0; j--) {
                        const value = (index >> j) & 1;
                        const variable = String.fromCharCode(65 + (variables - 1 - j));
                        term += value === 1 ? variable : `${variable}'`;
                    }
                    terms.push(term);
                }
            });
            return terms.length > 0 ? terms.join(' + ') : '0';
        }

        function generatePOS(variables, outputs) {
            const terms = [];
            outputs.forEach((output, index) => {
                if (output === '0') {
                    let term = [];
                    for (let j = variables - 1; j >= 0; j--) {
                        const value = (index >> j) & 1;
                        const variable = String.fromCharCode(65 + (variables - 1 - j));
                        term.push(value === 0 ? variable : `${variable}'`);
                    }
                    terms.push(`(${term.join(' + ')})`);
                }
            });
            return terms.length > 0 ? terms.join(' · ') : '1';
        }

        function simplifyExpression(variables, outputs) {
        
            const minterms = outputs.map((output, index) => output === '1' ? index : -1).filter(x => x !== -1);
            if (minterms.length === 0) return '0';
            if (minterms.length === Math.pow(2, variables)) return '1';

    
            const binaryTerms = minterms.map(m => m.toString(2).padStart(variables, '0'));
            
            
            const groups = {};
            binaryTerms.forEach(term => {
                const ones = (term.match(/1/g) || []).length;
                if (!groups[ones]) groups[ones] = [];
                groups[ones].push(term);
            });

            
            const primeImplicants = [];
            Object.values(groups).forEach(group => {
                group.forEach(term => {
                    let simplified = term;
                    for (let i = 0; i < variables; i++) {
                        if (minterms.includes(parseInt(simplified.replace(simplified[i], '0'), 2)) &&
                            minterms.includes(parseInt(simplified.replace(simplified[i], '1'), 2))) {
                            simplified = simplified.slice(0, i) + '-' + simplified.slice(i + 1);
                        }
                    }
                    if (!primeImplicants.includes(simplified)) {
                        primeImplicants.push(simplified);
                    }
                });
            });

            
            return primeImplicants.map(term => {
                let algebraic = '';
                for (let i = 0; i < variables; i++) {
                    if (term[i] !== '-') {
                        const variable = String.fromCharCode(65 + i);
                        algebraic += term[i] === '1' ? variable : `${variable}'`;
                    }
                }
                return algebraic;
            }).join(' + ');
        }

        function generateCircuitDiagram(expression) {
            
            const terms = expression.split(' + ');
            let mermaidCode = 'graph LR\n';
            
           
            const variables = new Set();
            terms.forEach(term => {
                Array.from(term).forEach(char => {
                    if (char.match(/[A-F]/)) variables.add(char);
                });
            });
            
            variables.forEach(variable => {
                mermaidCode += `    ${variable}[${variable}]\n`;
                mermaidCode += `    ${variable}_not[${variable}']\n`;
                mermaidCode += `    ${variable} --> ${variable}_not\n`;
            });

           
            terms.forEach((term, i) => {
                const inputs = term.match(/[A-F]'?/g);
                const andGate = `and${i}((AND))`;
                mermaidCode += `    ${andGate}\n`;
                inputs.forEach(input => {
                    const node = input.includes("'") ? `${input[0]}_not` : input;
                    mermaidCode += `    ${node} --> ${andGate}\n`;
                });
            });

            
            if (terms.length > 1) {
                mermaidCode += '    or((OR))\n';
                terms.forEach((_, i) => {
                    mermaidCode += `    and${i} --> or\n`;
                });
                mermaidCode += '    or --> F[Output]\n';
            } else {
                mermaidCode += `    and0 --> F[Output]\n`;
            }

            document.getElementById('circuitDiagram').innerHTML = `<div class="mermaid">${mermaidCode}</div>`;
            mermaid.init();
        }

        generateTable();