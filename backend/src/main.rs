#[macro_use] extern crate rocket;

#[get("/")]
fn index() -> &'static str {
    "L'API Rust est en ligne !"
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![index])
}