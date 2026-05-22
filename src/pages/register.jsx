import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function Register() {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleRegistro = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      // 1. Creamos las credenciales en Firebase Auth
      const credenciales = await createUserWithEmailAndPassword(auth, correo, password);
      const usuarioNuevo = credenciales.user;

      // 2. Guardamos su perfil en la colección "usuarios" con el rol "cliente"
      await setDoc(doc(db, 'usuarios', usuarioNuevo.uid), {
        nombre: nombre,
        correo: correo,
        rol: 'cliente'
      });

      // 3. Si todo sale bien, lo mandamos al login para que ingrese
      navigate('/');
      
    } catch (error) {
      console.error("Error en el registro:", error);
      setError('Hubo un error al registrar. Intenta con una contraseña más segura (mín. 6 caracteres).');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-xl shadow-lg md:p-8">
        
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-blue-600 md:text-3xl">
            Regístrate
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Crea tu cuenta de paciente en Nova Salud
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleRegistro} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
            <input 
              type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input 
              type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="juan@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña (Mín. 6 caracteres)</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full px-4 py-2 text-white font-medium rounded-lg transition-all ${cargando ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'}`}
          >
            {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            Ingresa aquí
          </Link>
        </p>
        
      </div>
    </div>
  );
}