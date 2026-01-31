#version 300 es

const int MAX_LIGHTS = 8;

struct LightInfo {
    // Light colour intensities
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    // Light geometry
    vec4 position;  // Position/direction of light 
    vec3 axis;
    float aperture;
    float cutoff;
    int onOff;
    int type;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};


uniform int u_blinn;    // determines if blinn (mode) == 1 (or not == 0)
uniform int u_n_lights; // Effective number of lights used

uniform LightInfo u_lights[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo u_material;        // The material of the object being drawn

in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_projection;
uniform mat4 u_model_view;
uniform mat4 u_normals;

out vec3 v_color;

void main() {
    vec4 positionEye = u_model_view * a_position;

    vec3 N = normalize( (u_normals * vec4(a_normal,0)).xyz);
    vec3 V = normalize(-positionEye.xyz); 
    vec3 L; 

    vec3 color = vec3(0,0,0);

    for (int i = 0; i < u_n_lights; i++){
        if(u_lights[i].onOff == 1){
            if(u_lights[i].position.w == 0.0)
                L = normalize(u_lights[i].position.xyz);
            else
                L = normalize(u_lights[i].position.xyz - positionEye.xyz);

            vec3 R = reflect(-L,N);
            vec3 H = normalize(L+V); 

            vec3 ambient = u_lights[i].ambient * u_material.Ka;

            float diffuseFactor = max( dot(L,N), 0.0 );
            vec3 diffuse = diffuseFactor * u_lights[i].diffuse * u_material.Kd; 

            float specularFactor;
            if(u_blinn == 1)
                specularFactor = pow(max(dot(N,H), 0.0), u_material.shininess);
            else 
                specularFactor = pow(max(dot(N,R), 0.0), u_material.shininess);

            vec3 specular = specularFactor * u_lights[i].specular * u_material.Ks; 

            if( dot(L,N) < 0.0 ) {specular = vec3(0.0, 0.0, 0.0);}


            //type 2 - spotlight
            if(u_lights[i].type == 2) {
                float cos_alpha = dot(normalize(L), normalize(-u_lights[i].axis));
                float cos_aperture = cos(radians(u_lights[i].aperture));
                float spotFactor = 0.0f;
                if(cos_alpha < cos_aperture) {
                    diffuse = vec3(0,0,0);
                    specular = vec3(0,0,0);
                } else {
                    spotFactor = pow(cos_alpha, u_lights[i].cutoff);
                }
                diffuse *= spotFactor;
                specular *= spotFactor;
            }

            color += ambient + diffuse + specular;
        }
    }

    v_color = color;

    gl_Position = u_projection * positionEye;

}
