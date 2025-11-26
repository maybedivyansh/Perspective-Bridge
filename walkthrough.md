# How to Load the Perspective Bridge Extension

I have successfully packaged the application as a Chrome extension. The build output is located in `frontend/dist`.

## Steps to Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right corner).
3. Click **Load unpacked**.
4. Select the `frontend/dist` directory:
   `/Users/divyansh/Desktop/py/perspective-bridge/frontend/dist`
5. The extension "Perspective Bridge" should appear in your list.

## Usage

1. Pin the extension to your toolbar.
2. Navigate to a news article (e.g., on CNN or Fox News).
3. Click the extension icon.
4. The popup will open, running the React application.
5. You can use it just like the web app!

## Notes

- The extension currently connects to your local backend at `http://localhost:3000`. Ensure the backend server is running (`npm start` in `backend` folder).
- If you make changes to the frontend code, run `npm run build` in the `frontend` directory and then click the refresh icon on the extension card in `chrome://extensions`.
