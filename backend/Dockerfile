FROM rustlang/rust:nightly-bookworm
WORKDIR /app
COPY . .
RUN cargo build
EXPOSE 8000
CMD ["cargo", "run"]