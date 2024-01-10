import dotenv from 'dotenv';
dotenv.config();
import express from 'express'
import mongoose from 'mongoose'
import handlebars from 'express-handlebars'
import {Server} from "socket.io"
import cookieParser from 'cookie-parser'
import session from 'express-session'
import FileStore from 'session-file-store'
import MongoStore from 'connect-mongo'
import passport from 'passport'

import { __dirname } from './utils.js'
import viewsRouter from './routes/views.routes.js'
import productsRouter from './routes/products.routes.js'
import usersRouter from './routes/users.routes.js'
import cartsRouter from './routes/carts.routes.js'
import ordersRouter from './routes/orders.routes.js'
import cookiesRouter from './routes/cookies.routes.js'
import sessionsRouter from './routes/sessions.routes.js'

const PORT = 8080
//MongoDB URL desde .env
const MONGOOSE_URL = process.env.MONGOOSE_URI
try {
    await mongoose.connect(MONGOOSE_URL)
    
    // Si deseamos integrar socket.io, guardamos la instancia
    // de express y se la pasamos al new Server
    const app = express()
    const httpServer = app.listen(PORT, () => {
        console.log(`Backend activo puerto ${PORT} conectado a BBDD 🔌`)
    })
    
    const socketServer = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
            credentials: false
        } 
    })
    
    // Ponemos al servidor de socket a escuchar conexiones
    // y habilitamos DENTRO las escuchas a tópicos específicos
    // que nos interesen
    socketServer.on('connection', socket => {
        // Escuchamos por el tópico llamado new_message
        // (solo ejemplo, cambiar al que se necesite)
        // y emitimos otro hacia todos los clientes
        socket.on('new_message', data => {
            socketServer.emit('message_added', data)
        })
    })

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser('secretKeyAbc123'))
    
    // Si queremos almacenar datos de sesión en archivo, utilizamos el módulo
    // session-file-store, creamos una instancia y configuramos debajo el store
    // Si en cambio preferimos guardar a MongoDB, utilizamos connect-mongo,
    // pero el proceso es similar al configurar el store.
    const fileStorage = FileStore(session)
    app.use(session({
        // ttl: time to live, tiempo de vida de la sesión en segs
        // Recordar!!!. habilitar UNO de los dos, NO ambos a la vez
        // store: new fileStorage({ path: './sessions', ttl: 60, retries: 0 }), // ARCHIVO
        store: MongoStore.create({ mongoUrl: MONGOOSE_URL, mongoOptions: {}, ttl: 200, clearInterval: 5000 }), // MONGODB
        secret: 'secretKeyAbc123',
        resave: false,
        saveUninitialized: false
    }))
    // Inicializo passport para su uso
    app.use(passport.initialize())
    app.use(passport.session())

    /** RUTAS **/
    app.engine('handlebars', handlebars.engine())
    app.set('views', `${__dirname}/views`)
    app.set('view engine', 'handlebars')
    // Agregamos este set para poder utilizar socket.io en los endpoints
    // ver ejemplo en products.routes.js
    app.set('socketServer', socketServer)

    app.get('/', (req,res) => res.render('index', { name: 'Tutor' }))
    app.use('/', viewsRouter)
    app.use('/api/products', productsRouter)
    app.use('/api/users', usersRouter)
    app.use('/api/carts', cartsRouter)
    app.use('/api/orders', ordersRouter)
    app.use('/api/cookies', cookiesRouter)
    app.use('/api/sessions', sessionsRouter)

    app.use('/static', express.static(`${__dirname}/public`))
} catch(err) {
    console.log(`Backend: error al inicializar 🚨🚨🚨(${err.message})`)
}