import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
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

export const handler: Handler = async (
  event: HandlerEvent, 
  context: HandlerContext
) => {
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
async function getProductos(event: HandlerEvent) {
  try {
    const { data, error } = await supabase.from('productos').select('*');
    
    if (error) throw error;
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al obtener productos' })
    };
  }
}

// Create new producto
async function createProducto(event: HandlerEvent) {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Datos de producto requeridos' })
      };
    }

    const productoData = JSON.parse(event.body);
    const validatedData = ProductoSchema.parse(productoData);

    const { data, error } = await supabase
      .from('productos')
      .insert(validatedData)
      .select();

    if (error) throw error;

    return {
      statusCode: 201,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Error al crear producto' })
    };
  }
}

// Update producto
async function updateProducto(event: HandlerEvent) {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Datos de producto requeridos' })
      };
    }

    const productoData = JSON.parse(event.body);
    const { id, ...updateData } = productoData;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID de producto requerido' })
      };
    }

    const validatedData = ProductoSchema.partial().parse(updateData);

    const { data, error } = await supabase
      .from('productos')
      .update(validatedData)
      .eq('id', id)
      .select();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Error al actualizar producto' })
    };
  }
}

// Delete producto
async function deleteProducto(event: HandlerEvent) {
  try {
    const id = event.queryStringParameters?.id;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'ID de producto requerido' })
      };
    }

    const { data, error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Error al eliminar producto' })
    };
  }
}
