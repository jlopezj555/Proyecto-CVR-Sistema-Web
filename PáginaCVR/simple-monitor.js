// simple-monitor.js
import os from 'os';
import fs from 'fs';

class SimpleMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = [];
  }

  getSystemInfo() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        systemTotal: Math.round(os.totalmem() / 1024 / 1024), // MB
        systemFree: Math.round(os.freemem() / 1024 / 1024), // MB
      },
      cpu: {
        loadAverage: os.loadavg()[0],
        cores: os.cpus().length,
      },
      platform: {
        os: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      }
    };
  }

  startMonitoring(intervalMs = 5000) {
    console.log('🔍 Iniciando monitoreo del sistema...');
    
    const interval = setInterval(() => {
      const metrics = this.getSystemInfo();
      this.metrics.push(metrics);
      
      console.log(`📊 Memoria: ${metrics.memory.used}MB/${metrics.memory.total}MB | CPU: ${metrics.cpu.loadAverage.toFixed(2)} | Uptime: ${Math.round(metrics.uptime/1000)}s`);
    }, intervalMs);

    return () => {
      clearInterval(interval);
      this.generateReport();
    };
  }

  generateReport() {
    const report = {
      testDuration: Date.now() - this.startTime,
      totalSamples: this.metrics.length,
      averageMemory: this.calculateAverage('memory.used'),
      peakMemory: Math.max(...this.metrics.map(m => m.memory.used)),
      averageCPU: this.calculateAverage('cpu.loadAverage'),
      peakCPU: Math.max(...this.metrics.map(m => m.cpu.loadAverage)),
      systemInfo: this.metrics[0]?.platform,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync('simple-performance-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 REPORTE DE RENDIMIENTO');
    console.log('========================');
    console.log(`Duración: ${Math.round(report.testDuration/1000)} segundos`);
    console.log(`Memoria promedio: ${report.averageMemory.toFixed(2)} MB`);
    console.log(`Memoria pico: ${report.peakMemory} MB`);
    console.log(`CPU promedio: ${report.averageCPU.toFixed(2)}`);
    console.log(`CPU pico: ${report.peakCPU.toFixed(2)}`);
    console.log(`Sistema: ${report.systemInfo?.os} ${report.systemInfo?.arch}`);
    console.log(`Node.js: ${report.systemInfo?.nodeVersion}`);
    
    console.log('\n💡 RECOMENDACIONES:');
    report.recommendations.forEach(rec => console.log(`- ${rec}`));
    
    return report;
  }

  calculateAverage(property) {
    const values = this.metrics.map(m => {
      const parts = property.split('.');
      let value = m;
      for (const part of parts) {
        value = value[part];
      }
      return value;
    }).filter(v => typeof v === 'number');
    
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  generateRecommendations() {
    const recommendations = [];
    const avgMemory = this.calculateAverage('memory.used');
    const peakMemory = Math.max(...this.metrics.map(m => m.memory.used));
    const avgCPU = this.calculateAverage('cpu.loadAverage');

    if (peakMemory > 1000) {
      recommendations.push('Memoria pico alta (>1GB). Considera optimizar el código o aumentar RAM del servidor.');
    }
    
    if (avgMemory > 500) {
      recommendations.push('Uso promedio de memoria alto. Revisa posibles memory leaks.');
    }
    
    if (avgCPU > 2) {
      recommendations.push('CPU promedio alto. Considera optimizar operaciones pesadas.');
    }
    
    if (peakMemory < 200 && avgCPU < 1) {
      recommendations.push('Rendimiento excelente. El sistema puede manejar más carga.');
    }

    // Recomendaciones de servidor
    if (peakMemory > 500) {
      recommendations.push('Servidor recomendado: 2GB RAM mínimo, 4GB recomendado');
    } else {
      recommendations.push('Servidor recomendado: 1GB RAM mínimo, 2GB recomendado');
    }
    
    recommendations.push('Almacenamiento: 20GB SSD mínimo');
    recommendations.push('Ancho de banda: 50 Mbps mínimo para 100 usuarios concurrentes');
    
    return recommendations;
  }
}

export default SimpleMonitor;