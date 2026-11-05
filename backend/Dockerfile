FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY backend/pom.xml ./
RUN mvn --batch-mode dependency:go-offline

COPY backend/src ./src
RUN mvn --batch-mode --no-transfer-progress -DskipTests package

FROM eclipse-temurin:21-jre-alpine

RUN addgroup --system app && adduser --system --ingroup app app

WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar

USER app

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
