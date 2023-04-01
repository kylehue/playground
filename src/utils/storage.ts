import templates, { Template } from "../templates";
import { nanoid } from "nanoid";
import generalOptions from "@app/options/general";
import editorOptions from "@app/options/editor";

const storageKeys = {
   projects: "projects",
   generalOptions: "options.general",
   editorOptions: "options.editor"
};

export function saveGeneralOptions(options: typeof generalOptions) {
   localStorage.setItem(
      storageKeys.generalOptions,
      JSON.stringify(options)
   );
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
   localStorage.setItem(storageKeys.editorOptions, JSON.stringify(options));
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

export function addProject(project: Omit<Partial<Template>, "id" | "lastEdited">) {
   let projects = getProjects();

   let newProject: Template = {
      id: nanoid(),
      name: project.name || "",
      lastEdited: Date.now(),
      files: project.files || [],
      packages: project.packages || [],
      options: project.options
   };

   projects.push(newProject);

   localStorage.setItem(storageKeys.projects, JSON.stringify(projects));

   return newProject;
}

export function removeProjectById(projectId: string) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         projects.splice(i, 1);
         localStorage.setItem(storageKeys.projects, JSON.stringify(projects))
         return project;
      }
   }

   return null;
}

export function updateProject(
   projectId: string,
   newProject: Omit<Partial<Template>, "id" | "lastEdited">
) {
   let projects = getProjects();

   for (let i = 0; i < projects.length; i++) {
      let project = projects[i];
      if (project.id === projectId) {
         project = Object.assign(project, newProject);
         project.lastEdited = Date.now();

         localStorage.setItem(storageKeys.projects, JSON.stringify(projects));
         return project;
      }
   }
}