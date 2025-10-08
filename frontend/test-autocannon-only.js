// test-autocannon-only.js
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import SimpleMonitor from './simple-monitor.js';

const execAsync = promisify(exec);

class AutocannonTester {
  constructor() {
    this.monitor = new SimpleMonitor();
    this.backendProcess = null;
  }

  async startBackend() {
    console.log('🚀 Iniciando backend...');
    return new Promise((resolve, reject) => {
      this.backendProcess = spawn('node', ['BACKEND/server.js'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Servidor corriendo') || output.includes('listening')) {
          console.log('✅ Backend iniciado correctamente');
          resolve();
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        console.error('Backend error:', data.toString());
      });

      setTimeout(() => {
        reject(new Error('Timeout iniciando backend'));
      }, 15000);
    });
  }

  async runLoadTests() {
    console.log('🎯 Ejecutando pruebas de carga...');
    
    const tests = [
      { name: 'Test básico', cmd: 'npx autocannon -c 5 -d 10 http://localhost:4000/api/usuarios' },
      { name: 'Test medio', cmd: 'npx autocannon -c 10 -d 20 http://localhost:4000/api/empresas' },
      { name: 'Test pesado', cmd: 'npx autocannon -c 20 -d 30 http://localhost:4000/api/procesos' }
    ];

    for (const test of tests) {
      console.log(`\n📊 ${test.name}...`);
      try {
        const { stdout, stderr } = await execAsync(test.cmd);
        console.log(stdout);
        if (stderr) console.error(stderr);
      } catch (error) {
        console.error(`Error en ${test.name}:`, error.message);
      }
    }
  }

  async runTests() {
    let stopMonitoring;
    
    try {
      stopMonitoring = this.monitor.startMonitoring(5000);
      await this.startBackend();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await this.runLoadTests();
      stopMonitoring();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      if (this.backendProcess) this.backendProcess.kill();
    }
  }
}

const tester = new AutocannonTester();
tester.runTests();