FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY *.sln .
COPY CarRental.WebApi/*.csproj ./CarRental.WebApi/
COPY CarRental.Application/*.csproj ./CarRental.Application/
COPY CarRental.Domain/*.csproj ./CarRental.Domain/
COPY CarRental.Infrastructure/*.csproj ./CarRental.Infrastructure/
COPY CarRental.Tests/*.csproj ./CarRental.Tests/

RUN dotnet restore

# Copy everything else and build
COPY . .
WORKDIR /src/CarRental.WebApi
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "CarRental.WebApi.dll"]