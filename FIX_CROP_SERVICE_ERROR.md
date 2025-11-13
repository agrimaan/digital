# Fix: Crop Service Startup Error

## Error Message
```
Error: Route.post() requires a callback function but got a [object Undefined]
```

## Root Cause
The `express-validator` module is listed in `package.json` but not installed in `node_modules`.

## Solution

Run the following commands in the crop-service directory:

```bash
cd /opt/agm/digital/backend/crop-service
npm install
npm run dev
```

## Why This Happened
When you pulled the new code from GitHub, the new `marketplaceController.js` requires `express-validator`, which is already in your `package.json` but needs to be installed in your local `node_modules`.

## Verification
After running `npm install`, you should see:
```
added X packages, and audited Y packages in Zs
```

Then when you run `npm run dev`, the service should start successfully:
```
Crop service running on port 3005
MongoDB connected
Service registered with Consul
```

## Alternative: Install Just the Missing Package
If you prefer to install only the missing package:

```bash
cd /opt/agm/digital/backend/crop-service
npm install express-validator
npm run dev
```

## Expected Output After Fix
```
[nodemon] starting `node server.js`
Crop service running on port 3005
MongoDB connected
Service registered with Consul
```

## Next Steps After Fix
1. Verify crop-service is running: `curl http://localhost:3005/health`
2. Start marketplace-service: `cd ../marketplace-service && npm run dev`
3. Start frontend: `cd ../../frontend && npm start`
4. Test the marketplace integration

## If Error Persists
1. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. Reinstall all dependencies:
   ```bash
   npm install
   ```

3. Start the service:
   ```bash
   npm run dev
   ```