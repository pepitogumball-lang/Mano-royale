# Mano Royale v1.1.0 ⭐

**Sistema de Segunda Mano Inteligente para Minecraft Bedrock Edition**  
_Detección automática de tipo de item + Colocación de bloques + Optimizado para Android_

## Características

### ⭐ v1.1.0 NUEVAS

- ✅ **Detección Automática** - Detecta si es comida o bloque
- ✅ **Botón Dinámico** - Cambio automático: "Comer" ↔ "Colocar"
- ✅ **Coloca Bloques** - Desde segunda mano directamente
- ✅ **Android Optimizado** - Interfaz para tablets (Samsung Galaxy SM-X200)
- ✅ **GitHub Actions** - Compilación automática a .mcaddon
- ✅ **27+ Comestibles** - Todos los alimentos de Minecraft
- ✅ **50+ Bloques** - Madera, piedra, decorativos, etc.

### Características Generales

- ✅ Coloca cualquier objeto en la segunda mano
- ✅ Come desde la segunda mano con un solo clic
- ✅ Antorcha de segunda mano con luz dinámica (nivel 15)
- ✅ Interfaz visual mejorada en la HUD
- ✅ Compatible con Minecraft Bedrock 1.16.0 - 1.20.50+
- ✅ Código completamente modular (fácil de extender)

## Requisitos

- Minecraft Bedrock Edition 1.16.0 o superior
- Experimental Features habilitado (para scripts)

## Instalación

1. Descarga o clona este repositorio
2. Copia `behavior_pack` y `resource_pack` a:
   - **Windows**: `%APPDATA%\.minecraft\development_packs\`
   - **macOS/Linux**: `~/.minecraft/development_packs/`
3. Añade una textura `offhand_torch.png` (32x32px) en `resource_pack/textures/items/`
4. Activa el add-on en un mundo de Minecraft através de Configuración → Comportamientos
5. Habilita los Experimental Features si es necesario

## Uso

### 🍎 COMER desde Segunda Mano

```
1. Obtén comida: /give @s apple
2. Coloca en offhand
3. ¡Toca el botón "COMER" en la HUD!
4. Automáticamente comiste
```

### 🧱 COLOCAR BLOQUES desde Segunda Mano (NUEVO v1.1.0)

```
1. Obtén bloques: /give @s oak_log 64
2. Coloca en offhand
3. Mira hacia donde quieres colocar
4. ¡Toca el botón "COLOCAR" en la HUD!
5. Automáticamente se coloca el bloque
```

### 🔍 Auto-Detect de Tipo

El botón cambia automáticamente:

| Item | Botón | Color |
|------|-------|-------|
| Comida 🍎 | **COMER** | Verde |
| Bloque 🧱 | **COLOCAR** | Azul |
| Herramienta 🛠️ | **USAR** | Amarillo |
| Ranged 🏹 | **DISPARAR** | Naranja |

### Antorcha Dinámica

```
/give @s manoroyale:offhand_torch
```
Coloca en offhand para tener luz dinámica (nivel 15)

## Estructura del Proyecto

```
Mano-royale/
├── behavior_pack/
│   ├── manifest.json           # Metadatos del pack
│   ├── functions/              # Funciones mcfunction
│   │   └── eat_offhand.mcfunction
│   ├── scripts/                # Scripts JavaScript
│   │   └── main.js
│   └── items/                  # Definiciones de items
│       └── offhand_torch.json
├── resource_pack/
│   ├── manifest.json           # Metadatos del resource pack
│   ├── textures/
│   │   └── items/
│   │       └── offhand_torch.png  # Textura personalizada
│   └── ui/
│       └── hud_screen.json     # Configuración de HUD
└── README.md
```

## Desarrollo

Para modificar o extender este add-on:

1. Edita los scripts en `behavior_pack/scripts/`
2. Añade nuevas funciones en `behavior_pack/functions/`
3. Personaliza items en `behavior_pack/items/`
4. Modifica la UI en `resource_pack/ui/`
5. Añade texturas a `resource_pack/textures/`

## Compatibilidad

- ✅ Minecraft Bedrock 1.16.0 - 1.20.50 (versión actual)
- ✅ Windows 10/11
- ✅ Xbox
- ⚠️ Versiones más nuevas pueden requerir actualización

## Licencia

Libre para uso personal y modificación. Crédito apreciado.

## Autor

pepitogumball-lang

---

**Nota**: Este add-on es completamente funcional pero está en desarrollo. Por favor reporta bugs o sugerencias.