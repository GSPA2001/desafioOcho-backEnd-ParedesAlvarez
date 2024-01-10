import { Router } from 'express'
import { uploader } from '../uploader.js'
import { ProductController } from '../controllers/product.controller.mdb.js'

const router = Router()
const controller = new ProductController()

// http://localhost:8080/api/products?limit=50&page=2&sort=asc
router.get('/', async (req, res) => {
    try {
        const products = await controller.getProducts()
        res.status(200).send({ status: 'OK', data: products })
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
})

router.post('/', uploader.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ status: 'FIL', data: 'No se pudo subir el archivo' })

        const { title, description, price, code, stock } = req.body
        if (!title || !description || !price || !code || !stock) {
            return res.status(400).send({ status: 'ERR', data: 'Faltan campos obligatorios' })
        }

        const newContent = {
            title,
            description,
            price,
            // el obj req.file está disponible porque estamos utilizando Multer como middleware,
            // mediante el objeto uploader que estamos importando e inyectando.
            thumbnail: req.file.filename,
            code,
            stock
        }

        const result = await controller.addProduct(newContent)

        // Si deseamos emitir algún evento de socket.io, primero necesitamos
        // obtener el objeto que seteamos en app.js y luego hacer un emit()
        const socketServer = req.app.get('socketServer')

        res.status(200).send({ status: 'OK', data: result })
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message })
    }
})

router.put('/:pid', async (req, res) => {
    try {
      const pid = req.params.pid;
  
      // Verificar si el pid tiene un formato válido de ID de MongoDB
      if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ status: 'error', error: 'Invalid product ID format' });
      }
  
      const updatedProduct = await productModel.findOneAndUpdate({ _id: pid }, req.body, { new: true });
  
      if (!updatedProduct) {
        return res.status(404).json({ error: 'The product does not exist' });
      }
  
      const updatedProducts = await productModel.find().lean().exec();
      req.app.get('socketio').emit('updatedProducts', updatedProducts);
      res.status(200).json({ message: `Updating the product: ${updatedProduct.title}` });
    } catch (err) {
      console.log(err);
      res.status(500).json({ status: 'error', error: err.message });
    }
});

router.delete('/:pid', async (req, res) => {
    try {
      const pid = req.params.pid;
  
      // Verificar si el pid tiene un formato válido de ID de MongoDB
      if (!pid.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ status: 'error', error: 'Invalid product ID format' });
      }
  
      const result = await productModel.findByIdAndDelete(pid);
  
      if (!result) {
        return res.status(404).json({ status: 'error', error: `No such product with id: ${pid}` });
      }
  
      const updatedProducts = await productModel.find().lean().exec();
      req.app.get('socketio').emit('updatedProducts', updatedProducts);
      res.status(200).json({ message: `Product with id ${pid} removed successfully`, products: updatedProducts });
    } catch (err) {
      console.log(err);
      res.status(500).json({ status: 'error', error: err.message });
    }
});

/**
 * Agregar aquí el resto de endpoints para completar el CRUD, realizando las llamadas
 * a los métodos correspondientes del controlador
 *
 * Recordar que tanto para PUT como para DELETE, se deberá pasar por req.params
 * el id correspondiente al documento que se desea operar.
*/

export default router