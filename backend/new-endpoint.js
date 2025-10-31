// Endpoint específico para procesos listos para impresión
app.get('/api/impresora/procesos-listos', verificarToken, async (req, res) => {
  const { empresa, rol, month, year } = req.query;

  try {
    // 1. Obtener la etapa de impresión desde el catálogo
    const [[etapaImpresion]] = await pool.query(`
      SELECT ec.id_etapa, ec.orden, ec.nombre_etapa
      FROM EtapaCatalogo ec
      WHERE ec.nombre_etapa LIKE '%Impresión de cuadernillo%'
      LIMIT 1
    `);

    if (!etapaImpresion) {
      return res.status(404).json({ 
        success: false, 
        message: 'Etapa de impresión no encontrada' 
      });
    }

    // 2. Obtener procesos donde:
    // - La etapa de impresión está pendiente/en progreso
    // - Todas las etapas anteriores están completadas
    let query = `
      SELECT DISTINCT 
        p.id_proceso,
        p.nombre_proceso,
        p.tipo_proceso,
        p.estado,
        p.fecha_creacion,
        p.fecha_completado,
        e.nombre_empresa
      FROM Proceso p
      INNER JOIN Empresa e ON p.id_empresa = e.id_empresa
      INNER JOIN EtapaProceso ep ON ep.id_proceso = p.id_proceso 
      WHERE p.estado != 'Completado'
      AND EXISTS (
        -- Existe la etapa de impresión y está pendiente/en progreso
        SELECT 1 FROM EtapaProceso ep_imp
        WHERE ep_imp.id_proceso = p.id_proceso
        AND ep_imp.id_etapa = ?
        AND ep_imp.estado IN ('Pendiente', 'En progreso')
      )
      AND NOT EXISTS (
        -- No hay etapas anteriores sin completar
        SELECT 1 FROM EtapaProceso ep_ant
        INNER JOIN EtapaCatalogo ec_ant ON ec_ant.id_etapa = ep_ant.id_etapa
        WHERE ep_ant.id_proceso = p.id_proceso
        AND ec_ant.orden < ?
        AND ep_ant.estado != 'Completada'
      )
    `;

    const params = [etapaImpresion.id_etapa, etapaImpresion.orden];

    // Añadir filtros
    if (empresa) {
      query += ' AND p.id_empresa = ?';
      params.push(empresa);
    }
    if (month && year) {
      query += ' AND MONTH(p.fecha_creacion) = ? AND YEAR(p.fecha_creacion) = ?';
      params.push(month, year);
    }

    query += ' ORDER BY p.fecha_creacion DESC';

    const [procesos] = await pool.query(query, params);

    // Si no hay resultados, intentar fallback por número de etapas completadas
    if (!procesos.length) {
      console.log('No se encontraron procesos por orden, probando fallback...');
      const [[totalEtapas]] = await pool.query('SELECT COUNT(*) as total FROM EtapaCatalogo');
      
      if (totalEtapas?.total) {
        const fallbackQuery = `
          SELECT DISTINCT 
            p.id_proceso,
            p.nombre_proceso,
            p.tipo_proceso,
            p.estado,
            p.fecha_creacion,
            p.fecha_completado,
            e.nombre_empresa
          FROM Proceso p
          INNER JOIN Empresa e ON p.id_empresa = e.id_empresa
          WHERE p.id_proceso IN (
            SELECT id_proceso
            FROM EtapaProceso
            WHERE estado = 'Completada'
            GROUP BY id_proceso
            HAVING COUNT(*) = ?
          )
          AND EXISTS (
            SELECT 1 FROM EtapaProceso ep_imp
            WHERE ep_imp.id_proceso = p.id_proceso
            AND ep_imp.id_etapa = ?
            AND ep_imp.estado IN ('Pendiente', 'En progreso')
          )
        `;
        
        const fallbackParams = [totalEtapas.total - 2, etapaImpresion.id_etapa]; // -2 porque falta la actual y la siguiente
        
        if (empresa) {
          fallbackQuery += ' AND p.id_empresa = ?';
          fallbackParams.push(empresa);
        }
        if (month && year) {
          fallbackQuery += ' AND MONTH(p.fecha_creacion) = ? AND YEAR(p.fecha_creacion) = ?';
          fallbackParams.push(month, year);
        }

        fallbackQuery += ' ORDER BY p.fecha_creacion DESC';
        
        const [fallbackProcesos] = await pool.query(fallbackQuery, fallbackParams);
        console.log(`Fallback encontró ${fallbackProcesos.length} procesos`);
        return res.json({
          success: true,
          data: fallbackProcesos,
          fallback: true
        });
      }
    }

    res.json({
      success: true,
      data: procesos
    });
  } catch (error) {
    console.error('Error en /api/impresora/procesos-listos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener procesos listos para impresión'
    });
  }
});