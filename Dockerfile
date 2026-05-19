# Use nginx as a lightweight web server to serve static files
FROM nginx:alpine

# Copy the src folder into nginx's default serving directory
COPY src/ /usr/share/nginx/html/

# Copy the vercel.json routing config (optional, for reference)
# nginx uses its own routing so we expose port 80
EXPOSE 80

# nginx starts automatically, no extra command needed
CMD ["nginx", "-g", "daemon off;"]