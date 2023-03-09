#include "dyte-settings.h"
#include "includes/webserver.h"
#include <nlohmann/json.hpp>

#include "effolkronium/random.hpp"
using namespace std;
using namespace nlohmann;
#include <curl/curl.h>
#include <API/api.h>

const std::string auth_value_v2 = "Basic MzNhMTBhMDYtMzBjMi00YTYyLWE0YzUtN2E4NWM5YWI3NjI5OmExNWJkYThkOTBlM2Y4MjM3ZjA0";
RESPONSE index_file(httpRequest req, httpResponse res, void *)
{
    
    res.setContentType(MIME_TYPE_text_html);
    return res.render("PUBLIC/index.html", 0);
}
RESPONSE index_JS_file(httpRequest req, httpResponse res, void *)
{
    res.setContentType(MIME_TYPE_text_javascript);
    return res.render("PUBLIC/index.js", 0);
}

RESPONSE create_meet_api(httpRequest req, httpResponse res, void *)
{
    nlohmann::json j;
    std::string title = req._GET("title");
    nlohmann::json jx;

    if (title.empty())
    {
        j["success"] = false;
    }
    else
    {
        jx["title"] = title;
        jx["live_stream_on_start"] = false;
        jx["preferred_region"] = "ap-southeast-1";
        jx["record_on_start"] = false;

        try
        {
            console::log("sending api request");
            nlohmann::json response = API::post("https://api.cluster.dyte.in/v2/meetings", jx.dump(), {{"Authorization", auth_value_v2}, {"Content-Type", "application/json"}});
            std::string meetId = response["data"]["data"]["id"];

            console::log("request done");
            if (response["Error"] == false && response["data"]["success"] == true)
            {

                j["success"] = true;
                j["meetId"] = meetId;
            }
            else
            {
                j["success"] = false;
            }
        }
        catch (std::exception &e)
        {

            j["success"] = false;
        }
    }

    res.setContentType(MIME_TYPE_application_json);

    return res.RawResponse(j.dump());
}

// not avaliable dyte is not providing api for ending meeting
RESPONSE close_meet(httpRequest req, httpResponse res, void *)
{
    res.setContentType(MIME_TYPE_application_json);
    nlohmann::json resjson;
    std::string meetId = req._GET("mid");
    std::string title = req._GET("title");

    if (meetId.empty() || title.empty())
    {

        resjson["success"] = false;
    }
    else
    {
        std::string baseurl = "https://api.cluster.dyte.in/v2/meetings/";
        baseurl += meetId;
        nlohmann::json resp;
        resp["status"] = "CLOSED";
        resp["title"] = title;

        // nlohmann::json response = API::patch(baseurl, resp.dump(), {{"Authorization", auth_value_v2}, {"Content-Type", "application/json"}});
        //     console::log(response.dump());
        //     resjson["success"] = true;
        //     resjson["data"] = response;
    }

    return res.RawResponse(resjson.dump());
}
RESPONSE create_meet(httpRequest req, httpResponse res, void *)
{
    res.setContentType(MIME_TYPE_text_javascript);

    std::string meeting_title = getRandomSessionId(4);
    nlohmann::json j;
    j["title"] = meeting_title;
    j["record_on_start"] = false;
    j["live_stream_on_start"] = false;
    j["preferred_region"] = "ap-southeast-1";

    console::log("setting data is ");
    console::log(j.dump());
    try
    {
        nlohmann::json response = API::post("https://api.cluster.dyte.in/v2/meetings", j.dump(), {{"Authorization", auth_value_v2}, {"Content-Type", "application/json"}});
        std::string meetId = response["data"]["data"]["id"];
        console::log("response is");
        console::log(response.dump());
        if (response["Error"] == false && response["data"]["success"] == true)
        {

            res.setCookie("meetId", meetId);
            res.setCookie("hostType", "host");
            return res.HttpRedirect(REDIRECT_TYPE_FOUND, "/host-join");
        }
        else
        {
            
            return res.HttpResponse("Meeting is not created");
        }
    }
    catch (std::exception &e)
    {

        return res.HttpResponse("Internal server error");
    }
}

RESPONSE host_joinmeet(httpRequest req, httpResponse res, void *)
{
    res.setContentType(MIME_TYPE_text_html);
    return res.render("PUBLIC/host_join.html", 0);
}
RESPONSE checklat(httpRequest req, httpResponse res, void *)
{
    return res.HttpResponse("sample text");
}
RESPONSE join_meet(httpRequest req, httpResponse res, void *)
{

    std::string name = req._GET("name");
    std::string ht = req._GET("hostType");
    if (name.empty())
        name = getRandomSessionId(5);
    if (ht.empty())
        ht = "participants";
    std::string meetId = req._GET("mid");
    if (meetId.empty())
    {

        return res.HttpResponse("Unable to join meeting");
    }

    std::string u1 = "https://api.cluster.dyte.in/v2/meetings/";

    u1 += meetId;
    u1 += "/participants";

    nlohmann::json j;
    j["custom_participant_id"] = getRandomSessionId(5);
    if (ht.compare("host") == 0)
    {

        j["preset_name"] = "Dhisha-host";
    }
    else
    {
        j["preset_name"] = "IITM";
    }

    j["name"] = name;
    j["picture"] ="https://www.example.com";

    console::log("sending data is ");
    console::log(j.dump());
    try
    {
        nlohmann::json response = API::post(u1, j.dump(), {{"Authorization", auth_value_v2}, {"Content-Type", "application/json"}});
         console::log(response.dump());
        if (response["data"]["success"])
        {

            nlohmann::json x;
            x["authtoken"] = response["data"]["data"]["token"].dump();

            return res.render("index23.html", x, true);
        }
        else
        {

            return res.HttpResponse(response.dump());
        }
    }
    catch (std::exception &e)
    {

        return res.HttpResponse("Internal server error");
    }
}
int main()
{

    webserver server("127.0.0.1", 8088);

    // server.onRequest("/", index_file);
    server.onRequest("/index.js", index_JS_file);
    // server.onRequest("/create-meeting", create_meet);
    server.onRequest("/create-meeting-api", create_meet_api);
    server.onRequest("/join-meeting", join_meet);
    server.onRequest("/host-join", host_joinmeet);
    // not avaliable
    // server.onRequest("/close-meeting-api", close_meet);
    server.onRequest("/disha-logo.png", "PUBLIC/dhisa-logo.png", MIME_TYPE_image_png);
    server.onRequest("/tlib.js", "PUBLIC/tlib.js", MIME_TYPE_text_javascript);
    server.onRequest("/index.es.js", "PUBLIC/index.es.js", MIME_TYPE_text_javascript);

    server.onRequest("/audioprocessor.js", "PUBLIC/audioprocessor.js", MIME_TYPE_text_javascript);
    server.onRequest("/google-processor.js", "PUBLIC/google-processor.js", MIME_TYPE_text_javascript);
    server.onRequest("/checklat", checklat);
    server.onRequest("/join-participant", "PUBLIC/join-meeting.html", MIME_TYPE_text_html);
    server.onRequest("/copy-image.png", "PUBLIC/index.png", MIME_TYPE_image_png);
    server.onRequest("/user.webp", "PUBLIC/user.webp", MIME_TYPE_image_webp);
    server.start();
    server.wait();

    return 0;
}
