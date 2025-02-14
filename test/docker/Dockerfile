FROM node:18-alpine

# Add curl (if needed for your application)
RUN apk --no-cache add curl

# Set working directory
WORKDIR /app

# Copy application files to the container
COPY ./ /app

# Dynamically create a package.json to enable ES module support
RUN echo '{ "type": "module", "dependencies": { "@cucumber/cucumber": "^10.0.0", "chai": "^4.3.7", "chai-json-schema": "^1.5.1", "chai-string": "^1.5.0", "pactum": "^3.1.0" } }' > /app/package.json

# Install all dependencies listed in the package.json
RUN npm install --loglevel=error

# Verify that @cucumber/cucumber is installed
RUN npm list @cucumber/cucumber

# Entrypoint script (ensure this script exists and is executable)
ENTRYPOINT ["/app/docker/entrypoint.sh"]
