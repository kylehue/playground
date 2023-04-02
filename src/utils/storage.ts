import templates, { Template } from "../templates";
import { nanoid } from "nanoid";
import generalOptions from "@app/options/general";
import editorOptions from "@app/options/editor";

const storageKeys = {
   projects: "projects",
   generalOptions: "options.general",
   editorOptions: "options.editor",
   temp: "temp"
};

export function saveTempProject(project: Partial<Template>) {
   try {
      localStorage.setItem(storageKeys.temp, JSON.stringify(project));
   } catch (error) {
      if (error == "QUOTA_EXCEEDED_ERR") {
         alert("Storage is full. Try deleting some projects.");
      }
   }
}

export function getTempProject() {
   let result: Partial<Template> | null = null;
   let raw = localStorage.getItem(storageKeys.temp);
   if (raw) {
      result = JSON.parse(raw);
   }
   
   return result;
}

export function saveGeneralOptions(options: typeof generalOptions) {
   try {
      localStorage.setItem(storageKeys.generalOptions, JSON.stringify(options));
   } catch (error) {
      if (error == "QUOTA_EXCEEDED_ERR") {
         alert("Storage is full. Try deleting some projects.");
      }
   }
}

export function getGeneralOptions() {
   let raw = localStorage.getItem(storageKeys.generalOptions);
   let result: typeof generalOptions = generalOptions;
   if (raw) {
      result = JSON.parse(raw);
   }

   return result;
}

export function saveEditorOptions(options: typeof editorOptions) {
   try {
      localStorage.setItem(storageKeys.editorOptions, JSON.stringify(options));
   } catch (error) {
      if (error == "QUOTA_EXCEEDED_ERR") {
         alert("Storage is full. Try deleting some projects.");
      }
   }
}

export function getEditorOptions() {
   let raw = localStorage.getItem(storageKeys.editorOptions);
   let result: typeof editorOptions = editorOptions;
   if (raw) {
      result = JSON.parse(raw);
   }

   return result;
}

export function getProjects() {
   let raw = localStorage.getItem(storageKeys.projects);
   let result: Template[] = [...templates];
   if (raw) {
      let parsed = JSON.parse(raw);
      result = parsed;
   }

   return result;
}

export function addProject(project: Partial<Template>) {
   let projects = getProjects();

   let newProject: Template = {
      id: nanoid(),
      name: project.name || "",
      lastEdited: Date.now(),
      files: project.files || [],
      packages: project.packages || [],
      options: project.options,
   };

   projects.push(newProject);

   try {
      localStorage.setItem(storageKeys.projects, JSON.stringify(projects));
   } catch (error) {
      if (error == "QUOTA_EXCEEDED_ERR") {
         alert("Storage is full. Try deleting some projects.");
      }
   }

   return newProject;
}

export function removeProjectById(projectId: string) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         projects.splice(i, 1);
         try {
            localStorage.setItem(
               storageKeys.projects,
               JSON.stringify(projects)
            );
         } catch (error) {
            if (error == "QUOTA_EXCEEDED_ERR") {
               alert("Storage is full. Try deleting some projects.");
            }
         }
         return project;
      }
   }

   return null;
}

export function updateProject(
   projectId: string,
   newProject: Partial<Template>
) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         project = Object.assign(project, newProject);
         project.lastEdited = Date.now();

         try {
            localStorage.setItem(storageKeys.projects, JSON.stringify(projects));
         } catch (error) {
            if (error == "QUOTA_EXCEEDED_ERR") {
               alert("Storage is full. Try deleting some projects.")
            }
         }
         return project;
      }
   }
}
