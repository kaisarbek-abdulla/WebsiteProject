const { db } = require('../firebase/admin');

exports.connectDevice = async (req, res) => {
  const { deviceType, deviceName } = req.body;
  const userId = req.user.id;
  
  if (!deviceType || !deviceName) {
    return res.status(400).json({ error: 'Device type and name required' });
  }

  const device = {
    userId,
    deviceType,
    deviceName,
    connectedAt: new Date().toISOString(),
    status: 'connected'
  };

  try {
    if (db) {
      await db.collection('devices').add(device);
    }
    res.json({ success: true, device });
  } catch (e) {
    console.error('Connect device failed:', e.message);
    res.status(500).json({ error: 'Failed to connect device' });
  }
};

exports.getDevices = async (req, res) => {
  const userId = req.user.id;
  try {
    let devices = [];
    if (db) {
      const snapshot = await db.collection('devices').where('userId', '==', userId).get();
      devices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    res.json(devices);
  } catch (e) {
    console.error('Get devices failed:', e.message);
    res.status(500).json({ error: 'Failed to get devices' });
  }
};

exports.disconnectDevice = async (req, res) => {
  const { deviceId } = req.params;
  const userId = req.user.id;
  
  try {
    if (db) {
      const deviceRef = db.collection('devices').doc(deviceId);
      const device = await deviceRef.get();
      
      if (!device.exists || device.data().userId !== userId) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      await deviceRef.update({ status: 'disconnected', disconnectedAt: new Date().toISOString() });
    }
    res.json({ success: true });
  } catch (e) {
    console.error('Disconnect device failed:', e.message);
    res.status(500).json({ error: 'Failed to disconnect device' });
  }
};