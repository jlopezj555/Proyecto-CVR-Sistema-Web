// test-simple.js
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import SimpleMonitor from './simple-monitor.js';

const execAsync = promisify(exec);

class SimpleTester {
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
        console.log('Backend:', output.trim());
        if (output.includes('Servidor corriendo') || output.includes('listening')) {
          console.log('✅ Backend iniciado correctamente');
          resolve();
        }
      });

      this.backendProcess.stderr.on('data', (data) => {
        console.error('Backend error:', data.toString());
      });

      this.backendProcess.on('error', (error) => {
        console.error('Error iniciando backend:', error);
        reject(error);
      });

      // Timeout después de 15 segundos
      setTimeout(() => {
        reject(new Error('Timeout iniciando backend'));
      }, 15000);
    });
  }

  async runArtilleryTest() {
    console.log('🎯 Ejecutando pruebas de carga con Artillery...');
    try {
      const { stdout, stderr } = await execAsync('artillery run artillery-simple.yml --output artillery-report.json');
      console.log('Artillery output:', stdout);
      if (stderr) console.error('Artillery stderr:', stderr);
      console.log('✅ Pruebas de Artillery completadas');
    } catch (error) {
      console.error('Error ejecutando Artillery:', error.message);
      throw error;
    }
  }

  async runAutocannonTest() {
    console.log('🚀 Ejecutando pruebas con Autocannon...');
    try {
      const { stdout, stderr } = await execAsync('npx autocannon -c 10 -d 30 http://localhost:4000/api/usuarios');
      console.log('✅ Autocannon completado');
      console.log(stdout);
      if (stderr) console.error('Autocannon stderr:', stderr);
    } catch (error) {
      console.error('Error ejecutando Autocannon:', error.message);
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Limpiando procesos...');
    if (this.backendProcess) {
      this.backendProcess.kill();
    }
  }

  async runTests() {
    let stopMonitoring;
    
    try {
      // Iniciar monitoreo
      stopMonitoring = this.monitor.startMonitoring(3000); // Cada 3 segundos

      // Iniciar backend
      await this.startBackend();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar 3 segundos

      // Ejecutar pruebas
      await this.runArtilleryTest();
      await this.runAutocannonTest();

      // Generar reporte
      stopMonitoring();
      
      console.log('\n✅ Todas las pruebas completadas');
      console.log('📁 Reportes generados:');
      console.log('- artillery-report.json');
      console.log('- simple-performance-report.json');

    } catch (error) {
      console.error('❌ Error en las pruebas:', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Ejecutar si es llamado directamente
const tester = new SimpleTester();
tester.runTests();