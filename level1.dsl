workspace {

    model {
        client    = person "Client"
        provider  = person "Service Provider"
        moderator = person "Moderator"

        khadamni = softwareSystem "Khadamni Platform" "Real-time local service marketplace. Supports geolocation-based provider discovery, service request management, real-time chat negotiation, AI-powered request analysis, portfolio showcase, ratings, dispute reporting, moderation tools."

        nominatim = softwareSystem "Nominatim" {
            description "OpenStreetMap geocoding service"
            tags "External"
        }

        osrm = softwareSystem "OSRM" {
            description "Route computation and distance estimation"
            tags "External"
        }

        groq = softwareSystem "AI Processing Service" {
            description "AI inference engine for request analysis and dispute resolution"
            tags "External"
        }

        smtp = softwareSystem "Email Notification Service" {
            description "OTP delivery and account notification emails"
            tags "External"
        }

        // ── ONLY external system connections ──

        khadamni -> nominatim "Send address / coordinates query"
        nominatim -> khadamni "Return geocoded location data"

        khadamni -> osrm "Send route computation request"
        osrm -> khadamni "Return route geometry, distance estimation"

        khadamni -> groq "Send request description for AI analysis"
        groq -> khadamni "Return structured category, price, dispute report"

        khadamni -> smtp "Send OTP codes, suspension notifications"
    }

    views {
        systemContext khadamni {
            include *
        }

        styles {
            element "Person" {
                shape person
                background #08427b
                color #ffffff
            }

            element "Software System" {
                background #dae8fc
                color #000000
            }

            element "External" {
                background #f8cecc
                color #000000
            }
        }

        theme default
    }
}