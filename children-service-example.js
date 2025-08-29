// Ejemplo de implementación para React Native - Gestión de Hijos
// Agregar estas funciones a tu authService existente

// Tipos de datos para hijos
export interface Child {
  id: string;
  parentId: string;
  name: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChildData {
  name: string;
  age: number;
}

export interface UpdateChildData {
  name?: string;
  age?: number;
}

// Servicios para gestión de hijos
export const childrenService = {
  // Obtener todos los hijos del usuario
  getChildren: async () => {
    console.log('👶 [CHILDREN] Obteniendo lista de hijos...');
    
    try {
      const response = await api.get('/api/auth/children');
      console.log('✅ [CHILDREN] Hijos obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error obteniendo hijos:', error);
      throw error;
    }
  },

  // Agregar un nuevo hijo
  addChild: async (data: CreateChildData) => {
    console.log('👶 [CHILDREN] Agregando hijo:', data);
    
    try {
      const response = await api.post('/api/auth/children', data);
      console.log('✅ [CHILDREN] Hijo agregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error agregando hijo:', error);
      throw error;
    }
  },

  // Actualizar un hijo existente
  updateChild: async (childId: string, data: UpdateChildData) => {
    console.log('👶 [CHILDREN] Actualizando hijo:', childId, data);
    
    try {
      const response = await api.put(`/api/auth/children/${childId}`, data);
      console.log('✅ [CHILDREN] Hijo actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error actualizando hijo:', error);
      throw error;
    }
  },

  // Eliminar un hijo
  deleteChild: async (childId: string) => {
    console.log('👶 [CHILDREN] Eliminando hijo:', childId);
    
    try {
      const response = await api.delete(`/api/auth/children/${childId}`);
      console.log('✅ [CHILDREN] Hijo eliminado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CHILDREN] Error eliminando hijo:', error);
      throw error;
    }
  }
};

// Funciones de utilidad para el perfil
export const profileService = {
  // Actualizar perfil con género y número de hijos
  updateProfile: async (data: {
    displayName?: string;
    email?: string;
    gender?: 'M' | 'F';
    childrenCount?: number;
  }) => {
    console.log('👤 [PROFILE] Actualizando perfil:', data);
    
    try {
      const response = await api.put('/api/auth/profile', data);
      console.log('✅ [PROFILE] Perfil actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PROFILE] Error actualizando perfil:', error);
      throw error;
    }
  },

  // Obtener perfil completo
  getProfile: async () => {
    console.log('👤 [PROFILE] Obteniendo perfil...');
    
    try {
      const response = await api.get('/api/auth/profile');
      console.log('✅ [PROFILE] Perfil obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [PROFILE] Error obteniendo perfil:', error);
      throw error;
    }
  }
};

// Ejemplo de uso en componentes React Native:

/*
// En tu componente de perfil:
const [profile, setProfile] = useState(null);
const [children, setChildren] = useState([]);

useEffect(() => {
  loadProfile();
  loadChildren();
}, []);

const loadProfile = async () => {
  try {
    const response = await profileService.getProfile();
    setProfile(response.data);
  } catch (error) {
    console.error('Error cargando perfil:', error);
  }
};

const loadChildren = async () => {
  try {
    const response = await childrenService.getChildren();
    setChildren(response.data);
  } catch (error) {
    console.error('Error cargando hijos:', error);
  }
};

const updateGender = async (gender) => {
  try {
    await profileService.updateProfile({ gender });
    loadProfile(); // Recargar perfil
  } catch (error) {
    console.error('Error actualizando género:', error);
  }
};

const addNewChild = async (name, age) => {
  try {
    await childrenService.addChild({ name, age });
    loadChildren(); // Recargar lista de hijos
    loadProfile(); // Recargar perfil (para actualizar childrenCount)
  } catch (error) {
    console.error('Error agregando hijo:', error);
  }
};
*/
