FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /build

# Build JVM: Maven + Lombok/MapStruct annotation processing needs metaspace headroom.
# Keep heap+metaspace under the 512MB free-tier build limit.
ENV MAVEN_OPTS="-Xmx320m -XX:MaxMetaspaceSize=160m"

COPY pom.xml mvnw ./
COPY .mvn .mvn

RUN chmod +x mvnw

COPY src src

RUN ./mvnw -B package -DskipTests


FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

# Runtime JVM tuned for Render free tier (512MB RAM).
#  - Heap 256m: comfortable for Hibernate + MapStruct without eating the whole container.
#  - Metaspace 128m: Spring Boot 3 + Hibernate 6 needs >96m; 96m was the OOM culprit.
#  - ReservedCodeCacheSize 64m: default is 240m, which competes with metaspace for RAM.
#  - UseSerialGC: lowest native-memory GC for small heaps (vs G1's region metadata).
#  - ActiveProcessorCount=2: stop JVM sizing thread pools from the host core count.
ENTRYPOINT ["java","-Duser.timezone=Asia/Ho_Chi_Minh", "-Xms128m", "-Xmx256m", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=64m", "-XX:+UseSerialGC", "-XX:ActiveProcessorCount=2", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]