This folder stores any modules you want to add on top of DeepHomieJS
These modules follow the following basic format:
    A folder with the module name
        Within that folder another folder called commands (required but it can be empty)
            Any discordJS commands that come with your module
        init.js (A javascript file with at least an exported function called init 
            with no parameters that initializes your module)
        Any other files you may need to make your module work

Because some modules may require initialization before.