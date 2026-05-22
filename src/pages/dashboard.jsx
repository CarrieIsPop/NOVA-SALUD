import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', categoria: '', precio_venta: '', stock_actual: '', stock_minimo: '' });
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [productoEditar, setProductoEditar] = useState({ id: '', nombre: '', precio_venta: '', stock_actual: '' });

  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [mostrarModalVentas, setMostrarModalVentas] = useState(false);

  const handleLogout = () => navigate('/');

  const cargarDatos = async () => {
    try {
      const productosRef = collection(db, 'productos');
      const resProd = await getDocs(productosRef);
      setProductos(resProd.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const ventasRef = collection(db, 'ventas');
      const resVentas = await getDocs(ventasRef);
      const listaVentas = resVentas.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
      setVentas(listaVentas);

      setCargando(false);
    } catch (error) {
      console.error("Error al obtener los datos: ", error);
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    try {
      const productoFormateado = {
        nombre: nuevoProducto.nombre, categoria: nuevoProducto.categoria,
        precio_venta: parseFloat(nuevoProducto.precio_venta), stock_actual: parseInt(nuevoProducto.stock_actual), stock_minimo: parseInt(nuevoProducto.stock_minimo)
      };
      await addDoc(collection(db, 'productos'), productoFormateado);
      setMostrarModalNuevo(false);
      setNuevoProducto({ nombre: '', categoria: '', precio_venta: '', stock_actual: '', stock_minimo: '' });
      setCargando(true);
      cargarDatos();
    } catch (error) { console.error("Error al guardar:", error); }
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}" del inventario?`)) {
      try { await deleteDoc(doc(db, 'productos', id)); setCargando(true); cargarDatos(); } catch (error) { console.error(error); }
    }
  };

  const abrirModalEdicion = (prod) => {
    setProductoEditar({ id: prod.id, nombre: prod.nombre, precio_venta: prod.precio_venta, stock_actual: prod.stock_actual });
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'productos', productoEditar.id), {
        precio_venta: parseFloat(productoEditar.precio_venta), stock_actual: parseInt(productoEditar.stock_actual)
      });
      setMostrarModalEditar(false); setCargando(true); cargarDatos();
    } catch (error) { console.error(error); }
  };

  const descargarPDFDesdeModal = () => {
    try {
      const doc = new jsPDF();
      const productosOrdenados = [...productos].sort((a, b) => (a.stock_actual ?? 0) - (b.stock_actual ?? 0));

      doc.setFontSize(18);
      doc.text("INFORME EJECUTIVO DE INVENTARIO", 14, 20);
      doc.setFontSize(10);
      doc.text(`Botica: NOVA SALUD | Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

      const tablaData = productosOrdenados.map(p => [
        p.nombre || 'Sin nombre', p.categoria || 'General', `S/ ${(p.precio_venta ?? 0).toFixed(2)}`, `${p.stock_actual ?? 0} unid.`, (p.stock_actual ?? 0) <= (p.stock_minimo ?? 0) ? "¡CRÍTICO: STOCK BAJO!" : "Óptimo"
      ]);

      autoTable(doc, {
        head: [['Medicamento', 'Categoría', 'Precio Venta', 'Existencias', 'Estado Crítico']],
        body: tablaData, startY: 35, styles: { fontSize: 9 }, headStyles: { fillColor: [30, 64, 175] }, 
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4 && data.cell.raw === "¡CRÍTICO: STOCK BAJO!") {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });
      doc.save("Reporte_NovaSalud_Gerencial.pdf");
    } catch (error) {
      console.error("Error crítico al compilar el reporte PDF:", error);
      alert("No se pudo generar el PDF.");
    }
  };

  const descargarPDFVentas = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text("REPORTE DE VENTAS MENSUALES", 14, 20);
      doc.setFontSize(10); doc.text(`Botica: NOVA SALUD | Generado el: ${new Date().toLocaleDateString()}`, 14, 28);

      let totalIngresos = 0;
      const tablaData = ventas.map(v => {
        totalIngresos += (v.precio || 0);
        return [
          new Date(v.fecha).toLocaleDateString(),
          v.boleta || 'Sin boleta',
          v.producto || 'Desconocido',
          (v.metodo || 'Efectivo').toUpperCase(),
          `S/ ${(v.precio ?? 0).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        head: [['Fecha', 'Nro. Boleta', 'Producto Vendido', 'Método', 'Monto']],
        body: tablaData, startY: 35, styles: { fontSize: 9 }, headStyles: { fillColor: [116, 34, 132] }
      });

      const finalY = doc.lastAutoTable.finalY || 35;
      doc.setFontSize(12); doc.setFont("Helvetica", "bold");
      doc.text(`TOTAL INGRESOS REGISTRADOS: S/ ${totalIngresos.toFixed(2)}`, 14, finalY + 10);

      doc.save("Reporte_Ventas_NovaSalud.pdf");
    } catch (error) { console.error(error); alert("Error al generar PDF de Ventas."); }
  };

  const totalProductosUnicos = productos.length;
  const productosEnAlerta = productos.filter(p => p.stock_actual <= p.stock_minimo);
  const ingresosTotales = ventas.reduce((suma, v) => suma + (v.precio || 0), 0);

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <nav className="bg-blue-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-xl font-bold text-white">NOVA SALUD - Panel Administrador</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-md hover:bg-gray-100 transition-colors">Cerrar Sesión</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Gestión de Inventario</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => setMostrarModalVentas(true)}
                className="px-4 py-2 bg-[#742284] text-white rounded-md hover:bg-purple-900 text-sm font-bold transition-colors shadow-sm"
              >
                💵 Registro Ventas
              </button>
              <button 
                onClick={() => setMostrarModalReporte(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm font-bold transition-colors shadow-sm"
              >
                📊 Generar Informe
              </button>
              <button onClick={() => setMostrarModalNuevo(true)} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm font-bold transition-colors">
                + Nuevo Producto
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargando ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Cargando inventario...</td></tr>
                ) : productos.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay productos.</td></tr>
                ) : (
                  productos.map((prod) => (
                    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{prod.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prod.categoria}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">S/ {prod.precio_venta?.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{prod.stock_actual} unid.</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {prod.stock_actual <= prod.stock_minimo ? (
                          <span className="px-2 inline-flex text-xs font-bold rounded-full bg-red-100 text-red-800 animate-pulse">Stock Bajo</span>
                        ) : (
                          <span className="px-2 inline-flex text-xs font-bold rounded-full bg-green-100 text-green-800">Adecuado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                        <button onClick={() => abrirModalEdicion(prod)} className="text-blue-600 hover:text-blue-900 font-bold">Editar</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => handleEliminar(prod.id, prod.nombre)} className="text-red-600 hover:text-red-900 font-bold">Eliminar</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-900">Agregar Producto</h3><button onClick={() => setMostrarModalNuevo(false)} className="text-gray-400 hover:text-gray-500">&times;</button></div>
            <form onSubmit={handleGuardarProducto} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700">Nombre</label><input type="text" required value={nuevoProducto.nombre} onChange={e => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Categoría</label><input type="text" required value={nuevoProducto.categoria} onChange={e => setNuevoProducto({...nuevoProducto, categoria: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div>
              <div><label className="block text-sm font-medium text-gray-700">Precio (S/)</label><input type="number" step="0.10" required value={nuevoProducto.precio_venta} onChange={e => setNuevoProducto({...nuevoProducto, precio_venta: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div>
              <div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-medium text-gray-700">Stock Actual</label><input type="number" required value={nuevoProducto.stock_actual} onChange={e => setNuevoProducto({...nuevoProducto, stock_actual: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div><div className="flex-1"><label className="block text-sm font-medium text-gray-700">Stock Mínimo</label><input type="number" required value={nuevoProducto.stock_minimo} onChange={e => setNuevoProducto({...nuevoProducto, stock_minimo: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setMostrarModalNuevo(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-bold">Guardar</button></div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-blue-50"><h3 className="text-lg font-bold text-blue-900">Actualizar Inventario</h3><button onClick={() => setMostrarModalEditar(false)} className="text-blue-400 hover:text-blue-600">&times;</button></div>
            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200"><p className="text-xs text-gray-500 uppercase font-bold">Producto Seleccionado</p><p className="text-gray-900 font-bold">{productoEditar.nombre}</p></div>
              <div><label className="block text-sm font-bold text-gray-700">Nuevo Precio de Venta (S/)</label><input type="number" step="0.10" required value={productoEditar.precio_venta} onChange={e => setProductoEditar({...productoEditar, precio_venta: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div>
              <div><label className="block text-sm font-bold text-gray-700">Ajustar Stock Actual</label><input type="number" required value={productoEditar.stock_actual} onChange={e => setProductoEditar({...productoEditar, stock_actual: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" /></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setMostrarModalEditar(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-bold">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold">Actualizar</button></div>
            </form>
          </div>
        </div>
      )}

      {mostrarModalReporte && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Informe Gerencial de Existencias</h3>
                <p className="text-xs text-slate-400">Nova Salud — Datos en Tiempo Real</p>
              </div>
              <button onClick={() => setMostrarModalReporte(false)} className="text-slate-400 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium uppercase">Variedad en Almacén</p>
                  <p className="text-3xl font-black text-blue-900 mt-1">{totalProductosUnicos} <span className="text-sm font-normal">fórmulas</span></p>
                </div>
                <div className={`p-4 rounded-xl border ${productosEnAlerta.length > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <p className={`text-sm font-medium uppercase ${productosEnAlerta.length > 0 ? 'text-red-600' : 'text-green-600'}`}>Alertas de Reposición</p>
                  <p className={`text-3xl font-black mt-1 ${productosEnAlerta.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                    {productosEnAlerta.length} <span className="text-sm font-normal">críticos</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Previsualización de Alertas</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Medicamento</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...productos].sort((a,b) => a.stock_actual - b.stock_actual).map((p) => (
                          <tr key={p.id} className={p.stock_actual <= p.stock_minimo ? 'bg-red-50/50' : ''}>
                            <td className="px-4 py-2.5 font-medium text-gray-900">{p.nombre}</td>
                            <td className="px-4 py-2.5 font-semibold text-gray-700">{p.stock_actual} unid.</td>
                            <td className="px-4 py-2.5">
                              {p.stock_actual <= p.stock_minimo ? (
                                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">¡URGENTE!</span>
                              ) : (
                                <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Óptimo</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setMostrarModalReporte(false)} className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl font-bold text-sm transition-colors">
                Cerrar Vista
              </button>
              <button onClick={descargarPDFDesdeModal} className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                📥 Descargar PDF Oficial
              </button>
            </div>

          </div>
        </div>
      )}

      {mostrarModalVentas && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in">
            
            <div className="px-6 py-4 bg-[#742284] text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Registro de Ventas (Auditoría)</h3>
                <p className="text-xs text-purple-200">Transacciones completadas por los clientes</p>
              </div>
              <button onClick={() => setMostrarModalVentas(false)} className="text-purple-200 hover:text-white text-2xl font-bold">&times;</button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="p-5 bg-purple-50 border border-purple-100 rounded-xl text-center">
                <p className="text-sm text-purple-600 font-medium uppercase tracking-widest">Ingresos Totales Acumulados</p>
                <p className="text-4xl font-black text-[#742284] mt-2">S/ {ingresosTotales.toFixed(2)}</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Últimas Transacciones</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Comprobante</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Producto</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500">Vía</th>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ventas.length === 0 ? (
                        <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-500">No hay ventas registradas aún.</td></tr>
                      ) : (
                        ventas.map((v) => (
                          <tr key={v.id}>
                            <td className="px-4 py-2 text-gray-600">{new Date(v.fecha).toLocaleDateString()}</td>
                            <td className="px-4 py-2 font-mono text-xs text-blue-600">{v.boleta}</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{v.producto}</td>
                            <td className="px-4 py-2">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${v.metodo === 'yape' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'}`}>
                                {(v.metodo || 'NA').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right font-black text-gray-900">S/ {(v.precio ?? 0).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setMostrarModalVentas(false)} className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-100 transition-colors">Cerrar Vista</button>
              <button onClick={descargarPDFVentas} disabled={ventas.length === 0} className="w-full sm:w-auto px-5 py-2 bg-[#742284] text-white hover:bg-purple-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:bg-gray-400 transition-all">
                📥 Imprimir Reporte Contable
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}