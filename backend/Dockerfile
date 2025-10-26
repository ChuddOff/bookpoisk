# ---------- build ----------
FROM maven:3.9-eclipse-temurin-23 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests clean package

# ---------- run ----------
FROM eclipse-temurin:23-jre
WORKDIR /app
COPY --from=build /app/target/bookvopoisk-0.0.1-SNAPSHOT.jar /app/app.jar
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENV SPRING_PROFILES_ACTIVE=render
CMD sh -c "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"
