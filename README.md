# ParlourEase - Separated Applications

This project has been restructured into two separate applications for better user experience and security:

## 📱 **Admin App** (`parlourease-admin/`)
- **Port**: 9003
- **URL**: http://localhost:9003
- **Purpose**: Salon management dashboard for staff
- **Features**: 
  - Appointment management
  - Service catalog management
  - Payment processing
  - Income analytics
  - Booking status updates

## 👥 **Client App** (`parlourease-client/`)
- **Port**: 9004  
- **URL**: http://localhost:9004
- **Purpose**: Customer booking interface
- **Features**:
  - Service browsing
  - Appointment booking
  - Date/time selection
  - Contact information

## 🚀 **How to Run**

### Admin App:
```bash
cd parlourease-admin
npm install
npm run dev
```
Visit: http://localhost:9003

### Client App:
```bash
cd parlourease-client
npm install
npm run dev
```
Visit: http://localhost:9004

## 📱 **Mobile APK Generation**

To generate APKs for Android:

### Option 1: PWA (Progressive Web App)
Both apps can be converted to PWAs and installed on Android devices.

### Option 2: React Native (Recommended)
For true native apps, consider converting to React Native:
- Better performance
- Native UI components
- Access to device features
- Smaller APK size

### Option 3: Capacitor/Cordova
Wrap the web apps in a native container for mobile deployment.

## 🔧 **Shared Backend**
Both apps connect to the same Firebase backend:
- **Project**: parlourease
- **Database**: Firestore
- **Real-time**: Live data synchronization

## 📊 **Benefits of Separation**
1. **Security**: Admin features isolated from client access
2. **Performance**: Smaller, focused applications
3. **Maintenance**: Easier to update and deploy independently
4. **User Experience**: Optimized interfaces for different user types
5. **Mobile Ready**: Each app can be optimized for mobile deployment
