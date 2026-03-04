const SS = SpreadsheetApp.getActive();
const PROD_SHEET = 'Productos';
const VENTAS_SHEET = 'Ventas';
const CONF_SHEET = 'Perfil'; 

function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('POS Ferretería')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// 1. Obtener productos
function getProductos() {
  const sh = SS.getSheetByName(PROD_SHEET);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

// 2. Obtener Configuración (Corregido para leer A2, B2, C2)
function getConfig() {
  const sh = SS.getSheetByName(CONF_SHEET);
  if (!sh) return { nombre: 'Mi Negocio', nit: '', telefono: '' };
  
  // Asumimos que la fila 1 son cabeceras y la fila 2 son los datos
  const data = sh.getRange(2, 1, 1, 3).getValues()[0]; 
  
  // Retornamos objeto mapeado
  return {
    nombre: data[0],  // Columna A
    nit: data[1],     // Columna B
    telefono: data[2] // Columna C
  };
}

// 3. Registrar Venta (Corregido para guardar detalle legible)
function registrarVenta(venta) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const shVentas = SS.getSheetByName(VENTAS_SHEET);
    const shProd = SS.getSheetByName(PROD_SHEET);
    
    // Generar ID y Fecha
    const idVenta = Utilities.getUuid().slice(0,8).toUpperCase();
    const fecha = new Date();
    
    // --- CREAR STRING LEGIBLE ---
    // En lugar de JSON, creamos una lista separada por comas
    // Ejemplo: "Tornillo 1 pulgada (x500), Lámina X (x1)"
    const detalleLegible = venta.items.map(item => {
      // Usamos la cantidad visual (ej: 500) en lugar de la de inventario
      return `${item.nombre} (x${item.cantidadVisual})`;
    }).join(', ');

    // Guardar en hoja Ventas
    shVentas.appendRow([
      idVenta, 
      fecha.toLocaleString(), 
      venta.total, 
      detalleLegible // <--- Aquí va el string limpio, no el JSON
    ]);

    // --- DESCONTAR INVENTARIO ---
    const dataProd = shProd.getDataRange().getValues();
    const headers = dataProd[0];
    const colId = headers.indexOf('id');
    const colStock = headers.indexOf('stock');

    if (colId === -1 || colStock === -1) return { exito: false, error: 'Columnas no encontradas' };

    let idMap = {}; 
    dataProd.forEach((r, i) => { if(i > 0) idMap[String(r[colId])] = i + 1; });

    venta.items.forEach(item => {
      const fila = idMap[String(item.id)];
      if (fila) {
        const celdaStock = shProd.getRange(fila, colStock + 1); 
        const stockActual = Number(celdaStock.getValue()) || 0;
        // Aquí descontamos la cantidad real de inventario (item.cantidad)
        celdaStock.setValue(Math.max(0, stockActual - Number(item.cantidad)));
      }
    });

    return { exito: true, id: idVenta, fecha: fecha.toLocaleString() };

  } catch (e) {
    return { exito: false, error: e.toString() };
  } finally {
    lock.releaseLock();
  }
}