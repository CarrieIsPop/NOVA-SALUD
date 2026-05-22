import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    try {
      const credenciales = await signInWithEmailAndPassword(auth, correo, password);
      const uid = credenciales.user.uid;

      const usuarioRef = doc(db, 'usuarios', uid);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        const datosUsuario = usuarioSnap.data();
        const rol = datosUsuario.rol;

        console.log(`Usuario autenticado con éxito. Rol: ${rol}`);

        if (rol === 'admin') {
          navigate('/dashboard');
        } else if (rol === 'cliente') {
          navigate('/catalogo');
        } else {
          setError('Tu cuenta no tiene un rol asignado en el sistema.');
        }
      } else {
        setError('No se encontraron datos de perfil para este usuario.');
      }

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos. Verifica tus datos.');
      } else {
        setError('Hubo un problema al conectar con el servidor. Intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 space-y-6 bg-white rounded-xl shadow-lg md:p-8">
        
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-blue-600 md:text-3xl tracking-tight">
            NOVA SALUD
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Acceso al sistema de gestión
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              required 
              disabled={cargando}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
              placeholder="user@novasalud.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input 
              type="password" 
              required 
              disabled={cargando}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full px-4 py-2 text-white font-medium rounded-lg transition-all ${
              cargando 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 active:scale-98'
            }`}
          >
            {cargando ? 'Verificando credenciales...' : 'Ingresar'}
          </button>
        </form>
        
        <p className="text-sm text-center text-gray-600 mt-4">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline transition-all">
            Regístrate aquí
          </Link>
        </p>
        
      </div>
    </div>
  );
}