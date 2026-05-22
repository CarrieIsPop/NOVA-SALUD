import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore'; 
import { db } from '../firebase/config';

import jsPDF from 'jspdf';

export default function Catalogo() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState(null);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [boletaId, setBoletaId] = useState('');

  const handleLogout = () => navigate('/');

  const cargarProductos = async () => {
    try {
      const productosRef = collection(db, 'productos');
      const respuesta = await getDocs(productosRef);
      const listaProductos = respuesta.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(listaProductos);
      setCargando(false);
    } catch (error) {
      console.error("Error al obtener el catálogo: ", error);
      setCargando(false);
    }
  };

  useEffect(() => { cargarProductos(); }, []);

  const handleConfirmarPago = async () => {
    try {
      const prodRef = doc(db, 'productos', productoSeleccionado.id);
      const nuevoStock = productoSeleccionado.stock_actual - 1;
      
      await updateDoc(prodRef, {
        stock_actual: nuevoStock >= 0 ? nuevoStock : 0
      });

      const numAleatorio = Math.floor(100000 + Math.random() * 900000);
      const idBoletaGenerado = `B001-${numAleatorio}`;
      setBoletaId(idBoletaGenerado);
      
      await addDoc(collection(db, 'ventas'), {
        boleta: idBoletaGenerado,
        producto: productoSeleccionado.nombre,
        precio: productoSeleccionado.precio_venta,
        metodo: metodoPago,
        fecha: new Date().toISOString()
      });

      setMostrarExito(true);
      cargarProductos();
    } catch (error) {
      console.error("Error al procesar la transacción:", error);
    }
  };

  const imprimirReciboPDF = () => {
    const docPdf = new jsPDF();
    docPdf.setFontSize(20);
    docPdf.setFont("Helvetica", "bold");
    docPdf.setTextColor(30, 64, 175);
    docPdf.text("BOTICA NOVA SALUD", 14, 20);
    docPdf.setFontSize(9);
    docPdf.setFont("Helvetica", "normal");
    docPdf.setTextColor(100, 116, 139);
    docPdf.text("Tu salud es nuestra prioridad", 14, 26);
    docPdf.text("RUC: 20601234567 | Dirección: Huancayo, Junín", 14, 31);
    docPdf.setFontSize(12);
    docPdf.setFont("Helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("BOLETA DE VENTA ELECTRÓNICA", 120, 20);
    docPdf.setFontSize(11);
    docPdf.text(`Nro: ${boletaId}`, 120, 26);
    docPdf.setFont("Helvetica", "normal");
    docPdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 120, 32);
    docPdf.text(`Pago: Digital (${metodoPago.toUpperCase()})`, 120, 38);
    docPdf.setDrawColor(226, 232, 240);
    docPdf.line(14, 45, 196, 45);
    docPdf.setFont("Helvetica", "bold");
    docPdf.text("Descripción del Medicamento", 14, 54);
    docPdf.text("Cant.", 130, 54);
    docPdf.text("P. Unit.", 150, 54);
    docPdf.text("Importe", 175, 54);
    docPdf.setFont("Helvetica", "normal");
    docPdf.line(14, 58, 196, 58);
    docPdf.text(productoSeleccionado.nombre, 14, 66);
    docPdf.text("1", 132, 66);
    docPdf.text(`S/ ${productoSeleccionado.precio_venta.toFixed(2)}`, 150, 66);
    docPdf.text(`S/ ${productoSeleccionado.precio_venta.toFixed(2)}`, 175, 66);
    docPdf.line(14, 72, 196, 72);
    docPdf.setFont("Helvetica", "bold");
    docPdf.text("TOTAL GENERAL:", 130, 82);
    docPdf.setTextColor(30, 64, 175);
    docPdf.text(`S/ ${productoSeleccionado.precio_venta.toFixed(2)}`, 175, 82);
    docPdf.setFont("Helvetica", "italic");
    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 116, 139);
    docPdf.text("¡Gracias por confiar en Nova Salud! Este documento es una representación impresa de la boleta electrónica.", 14, 100);
    docPdf.save(`NovaSalud_Boleta_${boletaId}.pdf`);
  };

  const cerrarFlujoPago = () => {
    setProductoSeleccionado(null);
    setMetodoPago(null);
    setMostrarExito(false);
    setBoletaId('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">NOVA SALUD</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Cerrar Sesión</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-black text-gray-900">Catálogo Digital de Medicamentos</h2>
          <p className="mt-2 text-gray-600 text-sm md:text-base">Adquiere tus productos farmacéuticos con validación y entrega inmediata en botica.</p>
        </div>

        {cargando ? (
          <div className="text-center py-20 text-gray-500 font-medium animate-pulse">Cargando fórmulas en almacén...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productos.map((prod) => (
              <div key={prod.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col hover:shadow-md transition-all duration-200">
                <div className="mb-3">
                  <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-full">{prod.categoria}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{prod.nombre}</h3>
                <div className="mt-4 flex items-center justify-between mb-5">
                  <span className="text-2xl font-black text-gray-900">S/ {prod.precio_venta?.toFixed(2)}</span>
                  {prod.stock_actual > 0 ? (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">Disponible ({prod.stock_actual} ud)</span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">Agotado</span>
                  )}
                </div>
                <button 
                  disabled={prod.stock_actual <= 0}
                  onClick={() => setProductoSeleccionado(prod)}
                  className={`mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    prod.stock_actual > 0 ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {prod.stock_actual > 0 ? 'Comprar Ahora' : 'Sin Existencias'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className={`px-6 py-4 text-white text-center transition-colors duration-300 ${
              mostrarExito ? 'bg-green-600' :
              metodoPago === 'yape' ? 'bg-[#742284]' :
              metodoPago === 'plin' ? 'bg-[#00E0C6] text-slate-900' : 'bg-blue-600'
            }`}>
              <h3 className="text-lg font-black tracking-tight">
                {mostrarExito ? '¡PAGO PROCESADO EXITOSAMENTE!' : 
                 metodoPago === 'yape' ? 'PAGO CON QR YAPE' :
                 metodoPago === 'plin' ? 'PAGO CON QR PLIN' : 'PASARELA DE PAGO DIGITAL'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">Nova Salud — Conectado a Servidor Seguro</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center">
              
              {!metodoPago && !mostrarExito && (
                <div className="space-y-5 text-center">
                  <p className="text-sm text-gray-600">Estás por adquirir: <strong className="text-gray-900">{productoSeleccionado.nombre}</strong></p>
                  <p className="text-3xl font-black text-blue-600">S/ {productoSeleccionado.precio_venta?.toFixed(2)}</p>
                  <div className="space-y-3 pt-2">
                    <button onClick={() => setMetodoPago('yape')} className="w-full bg-[#742284] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#5c1a69] transition-all active:scale-98 shadow-sm">Pagar con Yape</button>
                    <button onClick={() => setMetodoPago('plin')} className="w-full bg-[#00E0C6] text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-[#00c9b2] transition-all active:scale-98 shadow-sm">Pagar con Plin</button>
                  </div>
                </div>
              )}

              {metodoPago && !mostrarExito && (
                <div className="text-center space-y-5">
                  <div>
                    <p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Monto Final a Transferir</p>
                    <p className="text-3xl font-black text-gray-900 mt-0.5">S/ {productoSeleccionado.precio_venta?.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-center p-2 bg-white rounded-xl border-2 border-gray-100 max-w-[200px] mx-auto shadow-inner">
                    <svg className={`w-44 h-44 ${metodoPago === 'yape' ? 'text-[#742284]' : 'text-[#00c9b2]'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2 2h6v6H2V2zm2 2v2h2V4H4zm14-2h6v6h-6V2zm2 2v2h2V4h-2zM2 16h6v6H2v-6zm2 2v2h2v-2H4zm14 0h2v2h-2v-2zm2-2h2v2h-2v-2zm-2-2h2v2h-2v-2zm-4 4h2v4h-2v-4zm2-4h2v2h-2v-2zm-2-2h2v2h-2v-2zm-4 0h2v2H10v-2zm2 4h2v2h-2v-2zm2-6h2v2h-2V8zm-2 2h2v2h-2v-2zm-6-2h2v2H6V8zm6-4h2v2h-2V4zm-2 4h2v2h-2V8zM4 11h2v2H4v-2zm6 1v2H8v-2h2zm4-1h2v2h-2v-2zm-4-7h2v2h-2V4zm6 11h2v2h-2v-2z"/>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-500 px-4">Escanea el código QR desde tu billetera móvil, efectúa la transferencia y presiona el botón inferior para validar.</p>
                  <div className="pt-2 space-y-2">
                    <button onClick={handleConfirmarPago} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all active:scale-95 shadow-md">✓ Confirmar Transferencia Exitosa</button>
                    <button onClick={() => setMetodoPago(null)} className="w-full text-gray-500 hover:text-gray-700 font-bold text-xs transition-all">← Cambiar método de pago</button>
                  </div>
                </div>
              )}

              {mostrarExito && (
                <div className="text-center space-y-6 py-4 animate-fade-in">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-extrabold text-gray-900">¡Compra Confirmada!</h4>
                    <p className="text-sm text-gray-500 mt-1">El stock ha sido actualizado en nuestro almacén central.</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left text-xs space-y-1.5 font-mono text-gray-700 max-w-xs mx-auto">
                    <p className="font-bold border-b border-gray-200 pb-1 text-center text-gray-900">NOVA SALUD - COMPROBANTE</p>
                    <p><span className="font-bold">Código Doc:</span> {boletaId}</p>
                    <p><span className="font-bold">Producto:</span> {productoSeleccionado.nombre}</p>
                    <p><span className="font-bold">Cantidad:</span> 1 unidad</p>
                    <p><span className="font-bold">Pago via:</span> {metodoPago?.toUpperCase()}</p>
                    <p className="font-bold text-sm text-blue-600 pt-1 border-t border-dashed border-gray-300">Total: S/ {productoSeleccionado.precio_venta?.toFixed(2)}</p>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button onClick={imprimirReciboPDF} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md">📥 Descargar Boleta Electrónica (PDF)</button>
                    <button onClick={cerrarFlujoPago} className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all">Cerrar Ventana</button>
                  </div>
                </div>
              )}
            </div>
            
            {!mostrarExito && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button onClick={cerrarFlujoPago} className="text-gray-500 hover:text-gray-700 font-bold text-xs">Cancelar Operación</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}