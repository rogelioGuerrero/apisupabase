import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!, 
  process.env.SUPABASE_KEY!
);

// Producto Schema for validation
const ProductoSchema = z.object({
  nombre: z.string().min(1, "Nombre es requerido"),
  precio: z.number().positive("Precio debe ser positivo"),
  descripcion: z.string().optional()
});

export const handler: Handler = async (event, context) => {
  // Handle different HTTP methods
  switch (event.httpMethod) {
    case 'GET':
      return await getProductos(event);
    case 'POST':
      return await createProducto(event);
    case 'PUT':
      return await updateProducto(event);
    case 'DELETE':
      return await deleteProducto(event);
    default:
      return { 
        statusCode: 405, 
        body: JSON.stringify({ message: 'Método no permitido' }) 
      };
  }
};

// Get all productos
async function getProductos(event: any) {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    
    if (error) throw error;
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Error al obtener productos', 
        error: error.message 
      })
    };
  }
}

// Create new producto
async function createProducto(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    const producto = ProductoSchema.parse(body);
    
    const { data, error } = await supabase
      .from('productos')
      .insert(producto)
      .select();
    
    if (error) throw error;
    
    return {
      statusCode: 201,
      body: JSON.stringify(data[0])
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: 'Error al crear producto', 
        error: error.message 
      })
    };
  }
}

// Update producto
async function updateProducto(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id, ...updateData } = body;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID de producto es requerido' })
      };
    }
    
    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    return {
      statusCode: 200,
      body: JSON.stringify(data[0])
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: 'Error al actualizar producto', 
        error: error.message 
      })
    };
  }
}

// Delete producto
async function deleteProducto(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { id } = body;
    
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID de producto es requerido' })
      };
    }
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return {
      statusCode: 204,
      body: ''
    };
  } catch (error: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        message: 'Error al eliminar producto', 
        error: error.message 
      })
    };
  }
}
