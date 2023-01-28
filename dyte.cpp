#include "dyte-settings.h"
#include "includes/webserver.h"
#include <nlohmann/json.hpp>

#include "effolkronium/random.hpp"
using namespace std;
using namespace nlohmann;
#include <curl/curl.h>
#include <API/api.h>

std::fstream f("dyte-recording.log", std::fstream::trunc | std::fstream::out);

const std::string API_URL = "https://api.cluster.dyte.in/v1/organizations/33a10a06-30c2-4a62-a4c5-7a85c9ab7629/meeting";
const std::string auth_value = "a15bda8d90e3f8237f04";
RESPONSE index_file(httpRequest req, httpResponse res, void *)
{
    cout << f.is_open() << std::endl;
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
    std::string preset = req._GET("preset");
    nlohmann::json jx;
    if (!preset.empty())
    {
        jx["presetName"]=preset;
    }
    if (title.empty())
    {
        j["success"] = false;
    }
    else
    {
        
        jx["title"] = title;
        jx["recordOnStart"] = false;
        jx["liveStreamOnStart"] = false;

        
        jx["authorization"]["waitingRoom"] = false;
        jx["authorization"]["closed"] = false;
        try
        {
            nlohmann::json response = API::post(API_URL, jx.dump(), {{"Authorization", auth_value}, {"Content-Type", "application/json"}});
            std::string meetId = response["data"]["data"]["meeting"]["id"];
            std::string roomName = response["data"]["data"]["meeting"]["roomName"];

            if (response["Error"] == false && response["data"]["success"] == true)
            {
                std::string aa = "https://meeting.bhasa.io/join-meeting?mid=";

                aa += meetId;
                aa += "&rn=";
                aa += roomName;
                j["success"] = true;
                j["roomName"] = roomName;
                j["meetId"] = meetId;
                j["url"] = aa;
            }
            else
            {
                j["success"] = false;
            }
        }
        catch (std::exception &e)
        {
            f << "[+] Internal server error at meeting creation error" << e.what() << std::endl;

            j["success"] = false;
        }
    }

    res.setContentType(MIME_TYPE_application_json);

    return res.RawResponse(j.dump());
}
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
        std::string baseurl = "https://api.cluster.dyte.in/v1/organizations/33a10a06-30c2-4a62-a4c5-7a85c9ab7629/meetings/";
        baseurl += meetId;
        nlohmann::json resp;
        resp["status"] = "CLOSED";
        resp["presetName"] = "Bhasa";
        resp["title"] = title;

        nlohmann::json response = API::put(baseurl, resp.dump(), {{"Authorization", auth_value}, {"Content-Type", "application/json"}});
        console::log(response.dump());
        resjson["success"] = true;
        resjson["data"] = response;
    }

    return res.RawResponse(resjson.dump());
}
RESPONSE create_meet(httpRequest req, httpResponse res, void *)
{
    res.setContentType(MIME_TYPE_text_javascript);

    std::string meeting_title = getRandomSessionId(4);
    nlohmann::json j;
    j["title"] = meeting_title;
    j["recordOnStart"] = false;
    j["liveStreamOnStart"] = false;

    j["presetName"] = "Bhasa";
    j["authorization"]["waitingRoom"] = false;
    j["authorization"]["closed"] = false;
    try
    {
        nlohmann::json response = API::post(API_URL, j.dump(), {{"Authorization", auth_value}, {"Content-Type", "application/json"}});

        std::string meetId = response["data"]["data"]["meeting"]["id"];
        std::string roomName = response["data"]["data"]["meeting"]["roomName"];
        console::log("response is");
        console::log(response.dump());
        if (response["Error"] == false && response["data"]["success"] == true)
        {

            //    console::log("setting cookies");
            res.setCookie("meetId", meetId);
            res.setCookie("roomName", roomName);
            res.setCookie("hostType", "host");
            return res.HttpRedirect(REDIRECT_TYPE_FOUND, "/host-join");
        }
        else
        {
            f << "[+] meeting is not created error " << std::endl;
            f << response.dump() << std::endl;
            return res.HttpResponse("Meeting is not created");
        }
    }
    catch (std::exception &e)
    {
        f << "[+] Internal server error at meeting creation error" << e.what() << std::endl;

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
        ht = "participant";
    std::string meetId = req._GET("mid");
    std::string roomName2 = req._GET("rn");
    if (meetId.empty() || roomName2.empty())
    {
        f << "[+] someone entered wrong roomname or meeting id" << std::endl;

        return res.HttpResponse("Unable to join meeting");
    }

    std::string u1 = API_URL;
    u1 += "s/";
    u1 += meetId;
    u1 += "/participant";

    nlohmann::json j;
    j["clientSpecificId"] = getRandomSessionId(5);
     if(ht.compare("host") ==0){
       
    }
    else{
    
        j["roleName"] = "participant";

    }

    j["userDetails"]["name"] = name;
    
    j["userDetails"]["picture"] = "http://example.com";
    
    try
    {
        nlohmann::json response = API::post(u1, j.dump(), {{"Authorization", auth_value}, {"Content-Type", "application/json"}});
    
        if (response["data"]["success"])
        {

            nlohmann::json x;
            x["authtoken"] = response["data"]["data"]["authResponse"]["authToken"].dump();
            x["roomname"] = roomName2;

            return res.render("index23.html", x, true);
        }
        else
        {
            f << "[+] unable to join meeting" << std::endl;

            return res.HttpResponse("unable to join meeting");
        }
    }
    catch (std::exception &e)
    {
        f << "[+] internal server error" << e.what() << std::endl;

        return res.HttpResponse("Internal server error");
    }
}
int main()
{

    webserver server("127.0.0.1", 8088);

    server.onRequest("/", index_file);
    server.onRequest("/index.js", index_JS_file);
    server.onRequest("/create-meeting", create_meet);
    server.onRequest("/create-meeting-api", create_meet_api);
    server.onRequest("/join-meeting", join_meet);
    server.onRequest("/host-join", host_joinmeet);
    server.onRequest("/close-meeting-api", close_meet);
    server.onRequest("/disha-logo.png", "PUBLIC/dhisa-logo.png", MIME_TYPE_image_png);
    server.onRequest("/tlib.js", "PUBLIC/tlib.js", MIME_TYPE_text_javascript);
    server.onRequest("/audioprocessor.js", "PUBLIC/audioprocessor.js", MIME_TYPE_text_javascript);
    server.onRequest("/google-processor.js", "PUBLIC/google-processor.js", MIME_TYPE_text_javascript);
    server.onRequest("/checklat",checklat);

    server.onRequest("/join-participant", "PUBLIC/join-meeting.html", MIME_TYPE_text_html);
    server.onRequest("/copy-image.png", "PUBLIC/index.png", MIME_TYPE_image_png);
    server.onRequest("/user.webp", "PUBLIC/user.webp", MIME_TYPE_image_webp);
    server.start();
    server.wait();

    return 0;
}
