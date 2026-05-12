const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');

dotenv.config();
const app = express();

// simple bootstrapping: if there are no users in the database, create a
// default administrator account so the system is immediately usable. The
// password is `admin123` (hashed through bcrypt) and the email is
// admin@example.com. Change it after first login.
const bcrypt = require('bcryptjs');
const userModel = require('./models/userModel');

(async function seedAdmin() {
    try {
        const count = await userModel.count();
        if (count === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await userModel.create({
                name: 'Administrator',
                email: 'admin@example.com',
                password: hash,
                role: 'admin'
            });
            console.log('⚠️  No users found; default admin created: admin@example.com / admin123');
        }
    } catch (err) {
        console.error('Error during admin seeding:', err);
    }
})();

// middleware
app.use(cors());
app.use(express.json());

// import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);

// static files for client (if serving from same server)
app.use('/', express.static('client'));

const PORT = parseInt(process.env.PORT, 10) || 3000;

// attempt to start and, if the port is occupied, try the next one
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log(`\n✅ Server running on http://localhost:${port}`);
        console.log(`� Welcome page: http://localhost:${port}/`);
        console.log(`📊 Dashboard: http://localhost:${port}/pages/dashboard.html`);
        console.log(`📝 Products: http://localhost:${port}/pages/products.html`);
        console.log(`📦 Inventory: http://localhost:${port}/pages/inventory.html`);
        console.log(`📋 Orders: http://localhost:${port}/pages/orders.html\n`);
        
        // open Microsoft Edge automatically on the welcome page
        openBrowserEdge(`http://localhost:${port}/`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️  Port ${port} is already in use. Attempting port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

// open Microsoft Edge browser
function openBrowserEdge(url) {
    try {
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        spawn(edgePath, [url]);
        console.log('🌐 Opening Microsoft Edge...');
    } catch (err) {
        console.log(`💡 To open the system, visit: ${url}`);
    }
}

startServer(PORT);
