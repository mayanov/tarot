export default async (request, context) => {
    const country = context.geo?.country?.code;

    // If visitor is from Indonesia
    if (country === "ID") {
        return Response.redirect(
            new URL("/id.html", request.url),
                                 302
        );
    }

    // Everyone else
    return Response.redirect(
        new URL("/index.html", request.url),
                             302
    );
};
