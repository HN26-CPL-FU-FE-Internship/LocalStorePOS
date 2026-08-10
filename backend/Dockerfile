FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /build

ENV MAVEN_OPTS="-Xmx256m -XX:MaxMetaspaceSize=128m"

COPY pom.xml mvnw ./
COPY .mvn .mvn

RUN chmod +x mvnw

COPY src src

RUN ./mvnw -B package -DskipTests


FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xms128m", "-Xmx300m", "-XX:MaxMetaspaceSize=96m", "-jar", "app.jar"]