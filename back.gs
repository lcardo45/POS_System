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