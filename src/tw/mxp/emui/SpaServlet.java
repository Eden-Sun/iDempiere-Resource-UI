package tw.mxp.emui;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class SpaServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if (req.getPathInfo() != null) {
            path += req.getPathInfo();
        }

        // Serve resource or fallback
        if (!serveResource(path, req, resp)) {
            // Fallback to index.html for SPA routes
            // Only if it looks like a route (no extension) or specifically asked
            // But for simplicity, if not found and not an obvious asset, serve index.html
            
            // For safety, prevent infinite loop if index.html is missing
            if ("/index.html".equals(path)) {
                resp.sendError(HttpServletResponse.SC_NOT_FOUND, "index.html missing");
                return;
            }

             // If path has extension, likely 404
             if (hasExtension(path)) {
                 resp.sendError(HttpServletResponse.SC_NOT_FOUND);
                 return;
             }

             // Serve index.html
             if (!serveResource("/index.html", req, resp)) {
                 resp.sendError(HttpServletResponse.SC_NOT_FOUND, "index.html missing");
             }
        }
    }

    private boolean serveResource(String path, HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (path.endsWith("/")) {
            path += "index.html";
        }
        
        InputStream is = getServletContext().getResourceAsStream(path);
        if (is == null) {
            return false;
        }

        try (InputStream input = is) {
            String mimeType = getServletContext().getMimeType(path);
            if (mimeType == null) {
                mimeType = "application/octet-stream";
            }
            resp.setContentType(mimeType);

            // Copy stream
            OutputStream out = resp.getOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = input.read(buffer)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }
        return true;
    }
    
    private boolean hasExtension(String path) {
        int lastSlash = path.lastIndexOf('/');
        String lastSegment = (lastSlash >= 0) ? path.substring(lastSlash + 1) : path;
        return lastSegment.contains(".");
    }
}
