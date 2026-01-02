package tw.mxp.emui;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class SpaFilter implements Filter {

    private FilterConfig filterConfig;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        this.filterConfig = filterConfig;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        
        String path = req.getServletPath();
        if (req.getPathInfo() != null) {
            path += req.getPathInfo();
        }

        // 1. If it's the root path, let welcome-file handle it (usually index.html)
        if (path.equals("/")) {
            chain.doFilter(request, response);
            return;
        }

        // 2. Check if the resource exists in the web context
        boolean resourceExists = false;
        try {
            URL url = filterConfig.getServletContext().getResource(path);
            if (url != null) {
                resourceExists = true;
            }
        } catch (MalformedURLException e) {
            // Ignore
        }

        if (resourceExists) {
            chain.doFilter(request, response);
        } else {
            // 3. Resource doesn't exist.
            
            String lastSegment = path;
            int lastSlash = path.lastIndexOf('/');
            if (lastSlash >= 0) {
                lastSegment = path.substring(lastSlash + 1);
            }
            
            if (lastSegment.contains(".")) {
                // Likely a missing asset (image, css, js) -> 404 (let default servlet handle it)
                chain.doFilter(request, response);
            } else {
                // Likely a Client Side Route -> Forward to index.html
                request.getRequestDispatcher("/index.html").forward(request, response);
            }
        }
    }

    @Override
    public void destroy() {
    }
}
