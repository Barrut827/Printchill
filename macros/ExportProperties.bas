Attribute VB_Name = "PrintchillExportProperties"
Option Explicit

' Target: SolidWorks Design Premium 2026 SP0, 64-bit (API major 34).
' Requires the normal SolidWorks and constant type libraries.
' No document writes, rebuilds, configuration switches or property setters.
Private Type SYSTEMTIME
    Year As Integer
    Month As Integer
    DayOfWeek As Integer
    Day As Integer
    Hour As Integer
    Minute As Integer
    Second As Integer
    Milliseconds As Integer
End Type
Private Type GUID
    Data1 As Long
    Data2 As Integer
    Data3 As Integer
    Data4(0 To 7) As Byte
End Type
Private Declare PtrSafe Sub GetSystemTime Lib "kernel32" (ByRef value As SYSTEMTIME)
Private Declare PtrSafe Function CoCreateGuid Lib "ole32" (ByRef value As GUID) As Long
Private Declare PtrSafe Function StringFromGUID2 Lib "ole32" (ByRef value As GUID, ByVal buffer As LongPtr, ByVal count As Long) As Long

Private warnings As Collection
Private failures As Collection
Private currentStep As String

Public Sub main()
    Dim app As SldWorks.SldWorks
    Dim model As SldWorks.ModelDoc2
    Dim opened As SldWorks.ModelDoc2
    Dim fso As Object
    Dim source As String, target As String, temp As String
    Dim loadErrors As Long, loadWarnings As Long
    Dim dirtyBefore As Boolean, dirtyAfter As Boolean
    Dim readOnly As Boolean, ownDocument As Boolean
    Dim readOnlySet As Boolean
    Dim originalActive As String, originalSize As Variant, originalTime As Date
    Dim docProperties As String, configs As String, summary As String
    Dim fileData As String, documentData As String, features As String, bodies As String
    Dim result As String, status As String, configuration As String
    Dim message As String
    On Error GoTo Failed
    currentStep = "Initialisatie"
    Set warnings = New Collection
    Set failures = New Collection
    Set app = Application.SldWorks
    Set fso = CreateObject("Scripting.FileSystemObject")
    currentStep = "SolidWorks-versie: RevisionNumber"
    If Split(app.RevisionNumber, ".")(0) <> "34" Then
        Err.Raise vbObjectError + 40, , "Deze POC is bedoeld voor SolidWorks 2026 (API major 34). Gevonden: " & app.RevisionNumber
    End If

    currentStep = "Windows-bestandskiezer: GetOpenFileName"
    source = SelectSourcePart(app)
    If Len(source) = 0 Then Exit Sub
    If Not fso.FileExists(source) Then Err.Raise vbObjectError + 1, , "Bronbestand bestaat niet."
    source = fso.GetAbsolutePathName(source)
    If LCase$(fso.GetExtensionName(source)) <> "sldprt" Then Err.Raise vbObjectError + 2, , "Deze POC ondersteunt alleen .SLDPRT."

    ' Refuse all already open documents, even if they appear clean.
    currentStep = "Geopende documenten: GetFirstDocument / GetNext"
    Set opened = app.GetFirstDocument
    Do While Not opened Is Nothing
        If StrComp(opened.GetPathName, source, vbTextCompare) = 0 Then
            Err.Raise vbObjectError + 3, , "Dit part is al geopend. Sluit het eerst; de macro wijzigt of sluit jouw bestaande sessie niet."
        End If
        If Len(opened.GetPathName) > 0 Then
            If StrComp(fso.GetFileName(opened.GetPathName), fso.GetFileName(source), vbTextCompare) = 0 Then
                Err.Raise vbObjectError + 41, , "Een document met dezelfde bestandsnaam is al geopend. Sluit dat eerst om titelconflicten te voorkomen."
            End If
        End If
        Set opened = opened.GetNext
    Loop
    currentStep = "Actief document: ActiveDoc / GetTitle"
    If Not app.ActiveDoc Is Nothing Then originalActive = app.ActiveDoc.GetTitle

    target = CleanPath(InputBox("Volledig pad voor een NIEUW JSON-bestand:", "Printchill - JSON uitvoer", source & ".printchill.json"))
    If Len(target) = 0 Then Exit Sub
    target = fso.GetAbsolutePathName(target)
    If LCase$(fso.GetExtensionName(target)) <> "json" Then Err.Raise vbObjectError + 4, , "Uitvoer moet eindigen op .json."
    If fso.FileExists(target) Or fso.FolderExists(target) Then Err.Raise vbObjectError + 5, , "Uitvoer bestaat al; kies een nieuwe bestandsnaam."
    If Not fso.FolderExists(fso.GetParentFolderName(target)) Then Err.Raise vbObjectError + 6, , "Uitvoermap bestaat niet."
    currentStep = "Bronbestandsgrootte en wijzigingstijd lezen"
    originalSize = fso.GetFile(source).Size
    originalTime = fso.GetFile(source).DateLastModified
    fileData = FileDataJson(fso.GetFile(source))

    currentStep = "Part read-only openen: OpenDoc6"
    Set model = app.OpenDoc6(source, swDocPART, swOpenDocOptions_ReadOnly Or swOpenDocOptions_Silent, "", loadErrors, loadWarnings)
    If Not model Is Nothing Then ownDocument = True
    If model Is Nothing Or loadErrors <> 0 Then
        Err.Raise vbObjectError + 7, , "OpenDoc6 mislukt. Errorcode: " & loadErrors & "; warningcode: " & loadWarnings
    End If
    If loadWarnings <> 0 Then warnings.Add "OpenDoc6 warningcode: " & loadWarnings
    currentStep = "Read-only controleren: IsOpenedReadOnly"
    readOnly = model.IsOpenedReadOnly()
    If readOnly = False Then
        ' Only this macro's own, newly opened document may be changed to read-only.
        ' SetReadOnlyState changes the session access state, not CAD properties.
        currentStep = "Read-only expliciet instellen: SetReadOnlyState(True)"
        readOnlySet = model.SetReadOnlyState(True)
        currentStep = "Read-only opnieuw controleren: IsOpenedReadOnly"
        readOnly = model.IsOpenedReadOnly()
        ' Compare explicitly: some COM Boolean results are represented as 1,
        ' while canonical VBA True is -1. Bitwise Not can misclassify those.
        If (readOnlySet = False) Or (readOnly = False) Then
            Err.Raise vbObjectError + 8, , "Read-only niet bevestigd. SetReadOnlyState=" & _
                CStr(readOnlySet) & "; IsOpenedReadOnly=" & CStr(readOnly) & _
                "; OpenDoc6 warnings=" & CStr(loadWarnings)
        End If
        warnings.Add "OpenDoc6 leverde geen read-only sessie; SetReadOnlyState(True) is uitgevoerd en gecontroleerd voordat properties zijn gelezen."
    End If
    currentStep = "Documentstatus: GetSaveFlag"
    dirtyBefore = model.GetSaveFlag
    currentStep = "Configuratie: ConfigurationManager.ActiveConfiguration.Name"
    configuration = model.ConfigurationManager.ActiveConfiguration.Name
    If dirtyBefore Then warnings.Add "Document meldt al direct na openen niet-opgeslagen sessiewijzigingen."

    currentStep = "Documentproperties: Extension.CustomPropertyManager"
    docProperties = PropertiesJson(model.Extension.CustomPropertyManager(""), "document")
    currentStep = "Configuratieproperties uitlezen"
    configs = ConfigurationsJson(model, configuration)
    currentStep = "Summarygegevens uitlezen"
    summary = SummaryJson(model)
    currentStep = "Documentgegevens, eenheden, opslaghistorie en referenties"
    documentData = DocumentDataJson(app, model, source)
    currentStep = "Features en cut-list-properties van de actieve configuratie"
    features = FeaturesJson(model)
    currentStep = "Bodies van de actieve configuratie"
    bodies = BodiesJson(model)
    currentStep = "Eindstatus en configuratie controleren"
    dirtyAfter = model.GetSaveFlag
    If dirtyAfter Then warnings.Add "Document meldt niet-opgeslagen sessiewijzigingen; niets wordt opgeslagen."
    If configuration <> model.ConfigurationManager.ActiveConfiguration.Name Then
        Err.Raise vbObjectError + 9, , "Actieve configuratie is onverwacht gewijzigd."
    End If
    ' Close only the document opened here; never save it.
    currentStep = "Eigen document sluiten: CloseDoc / GetTitle"
    app.CloseDoc model.GetTitle
    ownDocument = False
    Set model = Nothing
    RestoreActive app, originalActive
    If fso.GetFile(source).Size <> originalSize Or fso.GetFile(source).DateLastModified <> originalTime Then
        Err.Raise vbObjectError + 10, , "Bronbestand is tijdens uitlezen gewijzigd. Geen JSON gepubliceerd."
    End If

    currentStep = "JSON opbouwen, export-ID en UTC-tijd genereren"
    status = "complete"
    If warnings.Count > 0 Or failures.Count > 0 Then status = "partial"
    result = "{" & _
        """schema_version"":""0.2"",""export_id"":" & J(NewGuid()) & _
        ",""exported_at_utc"":" & J(UtcNow()) & ",""status"":" & J(status) & _
        ",""source"":{""file_name"":" & J(fso.GetFileName(source)) & _
        ",""document_type"":""part"",""solidworks_version"":" & J(app.RevisionNumber) & _
        ",""target_installation"":""SolidWorks Design Premium 2026 SP0 64-bit (verify manually)""" & _
        ",""active_configuration"":" & J(configuration) & ",""opened_by_extractor"":true,""read_only"":true" & _
        ",""dirty_before"":" & JB(dirtyBefore) & ",""dirty_after"":" & JB(dirtyAfter) & "}" & _
        ",""extraction"":{""extractor"":""solidworks_vba"",""mode"":""cached_no_rebuild"",""rebuild_requested"":false,""configuration_activation_requested"":false,""scope"":[""document_properties"",""configuration_properties"",""summary"",""filesystem"",""document_data"",""features_active_configuration"",""bodies_active_configuration""]}" & _
        ",""summary"":" & summary & ",""document_properties"":" & docProperties & _
        ",""configurations"":" & configs & _
        ",""filesystem"":" & fileData & ",""document_data"":" & documentData & _
        ",""features"":" & features & ",""bodies"":" & bodies & _
        ",""unsupported_groups"":[""api_attribute_parameters"",""full_geometry"",""computed_mass"",""inactive_configuration_geometry"",""file_sha256""]" & _
        ",""warnings"":" & StringArray(warnings) & ",""errors"":" & StringArray(failures) & "}"

    currentStep = "UTF-8 JSON schrijven via ADODB.Stream"
    temp = fso.BuildPath(fso.GetParentFolderName(target), fso.GetTempName)
    WriteUtf8 temp, result
    ' MoveFile does not overwrite an existing destination (including a race).
    currentStep = "JSON publiceren: FileSystemObject.MoveFile"
    fso.MoveFile temp, target
    temp = ""
    MsgBox "JSON geschreven (status: " & status & ")." & vbCrLf & target & vbCrLf & _
        "Uitgebreide metadata-export. Geen rebuild of configuratiewissel aangevraagd.", vbInformation, "Printchill"
    Exit Sub
Failed:
    message = "Export afgebroken bij: " & currentStep & vbCrLf & _
        "Fout " & CStr(Err.Number) & ": " & Err.Description & vbCrLf & _
        "Bron: " & Err.source & vbCrLf & _
        "Er is geen nieuwe JSON gepubliceerd door deze run."
    On Error Resume Next
    If ownDocument Then app.CloseDoc model.GetTitle
    If Len(temp) > 0 Then
        If fso.FileExists(temp) Then fso.DeleteFile temp
    End If
    RestoreActive app, originalActive
    On Error GoTo 0
    MsgBox message, vbExclamation, "Printchill"
End Sub

Private Function PropertiesJson(ByVal manager As SldWorks.CustomPropertyManager, ByVal scope As String) As String
    Dim names As Variant, i As Long, item As String, result As String
    On Error GoTo Failed
    result = "["
    names = manager.GetNames
    If Not IsEmpty(names) Then
        If Not IsArray(names) Then Err.Raise vbObjectError + 20, , "GetNames gaf geen array terug."
        For i = LBound(names) To UBound(names)
            item = PropertyJson(manager, CStr(names(i)), scope)
            If i > LBound(names) Then result = result & ","
            result = result & item
        Next i
    End If
    PropertiesJson = result & "]"
    Exit Function
Failed:
    failures.Add scope & ": propertycollectie niet volledig uitleesbaar: " & Err.Description
    PropertiesJson = "null"
End Function

Private Function PropertyJson(ByVal manager As SldWorks.CustomPropertyManager, ByVal name As String, ByVal scope As String) As String
    Dim raw As String, resolved As String, wasResolved As Boolean, linked As Boolean
    Dim code As Long, kind As Long, label As String, issue As String
    On Error GoTo Failed
    kind = manager.GetType2(name)
    code = manager.Get6(name, True, raw, resolved, wasResolved, linked)
    Select Case code
        Case swCustomInfoGetResult_CachedValue
            label = "cached"
        Case swCustomInfoGetResult_ResolvedValue
            label = "resolved"
        Case swCustomInfoGetResult_NotPresent
            label = "not_present"
            failures.Add scope & ": property niet aanwezig tijdens lezen: " & name
        Case Else
            label = "unknown"
            failures.Add scope & ": onbekende Get6-status voor " & name & ": " & code
    End Select
    If label = "cached" Or (wasResolved = False) Then warnings.Add scope & ": cached/onopgeloste waarde: " & name
    PropertyJson = "{""name"":" & J(name) & ",""type_code"":" & CStr(kind) & _
        ",""type_label"":" & J(PropertyType(kind)) & ",""raw_value"":" & J(raw) & _
        ",""resolved_value"":" & J(resolved) & ",""read_status_code"":" & CStr(code) & _
        ",""read_status"":" & J(label) & ",""was_resolved"":" & JB(wasResolved) & _
        ",""linked_to_property"":" & JB(linked) & ",""error"":null}"
    Exit Function
Failed:
    issue = Err.Description
    failures.Add scope & ": property " & name & ": " & issue
    PropertyJson = "{""name"":" & J(name) & ",""error"":" & J(issue) & "}"
End Function

Private Function ConfigurationsJson(ByVal model As SldWorks.ModelDoc2, ByVal active As String) As String
    Dim names As Variant, i As Long, name As String, result As String, properties As String
    On Error GoTo Failed
    result = "["
    names = model.GetConfigurationNames
    If Not IsEmpty(names) Then
        If Not IsArray(names) Then Err.Raise vbObjectError + 21, , "GetConfigurationNames gaf geen array terug."
        For i = LBound(names) To UBound(names)
            name = CStr(names(i))
            properties = PropertiesJson(model.Extension.CustomPropertyManager(name), "configuration:" & name)
            If i > LBound(names) Then result = result & ","
            result = result & "{""name"":" & J(name) & ",""is_active"":" & JB(name = active) & _
                ",""details"":" & ConfigurationDataJson(model, name) & ",""properties"":" & properties & "}"
        Next i
    End If
    ConfigurationsJson = result & "]"
    Exit Function
Failed:
    failures.Add "Configuraties niet volledig uitleesbaar: " & Err.Description
    ConfigurationsJson = "null"
End Function

Private Function SummaryJson(ByVal model As SldWorks.ModelDoc2) As String
    SummaryJson = "{""title"":" & SummaryValue(model, swSumInfoTitle) & _
        ",""subject"":" & SummaryValue(model, swSumInfoSubject) & _
        ",""author"":" & SummaryValue(model, swSumInfoAuthor) & _
        ",""keywords"":" & SummaryValue(model, swSumInfoKeywords) & _
        ",""comments"":" & SummaryValue(model, swSumInfoComment) & _
        ",""last_saved_by"":" & SummaryValue(model, swSumInfoSavedBy) & _
        ",""created_date_raw"":" & SummaryValue(model, swSumInfoCreateDate) & _
        ",""last_saved_date_raw"":" & SummaryValue(model, swSumInfoSaveDate) & _
        ",""created_date_display"":" & SummaryValue(model, swSumInfoCreateDate2) & _
        ",""last_saved_date_display"":" & SummaryValue(model, swSumInfoSaveDate2) & _
        ",""date_interpretation"":""SolidWorks localized strings; not UTC-normalized""}"
End Function

Private Function SummaryValue(ByVal model As SldWorks.ModelDoc2, ByVal field As Long) As String
    On Error GoTo Failed
    SummaryValue = J(model.SummaryInfo(field))
    Exit Function
Failed:
    failures.Add "Summaryveld " & field & ": " & Err.Description
    SummaryValue = "null"
End Function

Private Function FileDataJson(ByVal file As Object) As String
    FileDataJson = "{""size_bytes"":" & JsonValue(file.Size) & _
        ",""created_local"":" & J(Format$(file.DateCreated, "yyyy-mm-dd\Thh:nn:ss")) & _
        ",""modified_local"":" & J(Format$(file.DateLastModified, "yyyy-mm-dd\Thh:nn:ss")) & _
        ",""accessed_local"":" & J(Format$(file.DateLastAccessed, "yyyy-mm-dd\Thh:nn:ss")) & _
        ",""attributes_bitmask"":" & JsonValue(file.Attributes) & _
        ",""time_basis"":""Windows local time; no UTC offset recorded; access time may be stale""}"
End Function

' Optional calls use late binding so an unavailable member cannot prevent
' compilation of the whole extractor. Failures are reported, never hidden.
Private Function Probe(ByVal obj As Object, ByVal member As String, ByVal kind As VbCallType, ByVal context As String) As String
    Dim value As Variant, issue As String, code As Long
    On Error GoTo Failed
    value = CallByName(obj, member, kind)
    Probe = "{""status"":""available"",""value"":" & JsonValue(value) & "}"
    Exit Function
Failed:
    code = Err.Number
    issue = Err.Description
    warnings.Add context & "." & member & ": " & CStr(code) & " - " & issue
    Probe = "{""status"":""unavailable"",""value"":null,""error_code"":" & CStr(code) & ",""error"":" & J(issue) & "}"
End Function

Private Function DocumentDataJson(ByVal app As SldWorks.SldWorks, ByVal model As SldWorks.ModelDoc2, ByVal path As String) As String
    DocumentDataJson = "{""title"":" & Probe(model, "GetTitle", VbMethod, "document") & _
        ",""document_type_code"":" & Probe(model, "GetType", VbMethod, "document") & _
        ",""unit_settings"":" & Probe(model, "GetUnits", VbMethod, "document") & _
        ",""unit_settings_layout"":[""length_unit_enum"",""fraction_base_enum"",""fraction_value"",""significant_digits"",""round_to_fraction""]" & _
        ",""equations"":" & EquationsJson(model) & _
        ",""saved_version_history"":" & SavedVersionsJson(app, path) & _
        ",""dependencies"":" & DependenciesJson(model) & "}"
End Function

Private Function SavedVersionsJson(ByVal app As SldWorks.SldWorks, ByVal path As String) As String
    Dim values As Variant
    On Error GoTo Failed
    values = app.VersionHistory(path)
    SavedVersionsJson = "{""status"":""available"",""entries_raw"":" & JsonValue(values) & _
        ",""meaning"":""Saved major-release history from disk; NOT a per-save revision history or runtime API version""}"
    Exit Function
Failed:
    warnings.Add "VersionHistory: " & Err.Description
    SavedVersionsJson = "{""status"":""unavailable"",""entries_raw"":null}"
End Function

Private Function DependenciesJson(ByVal model As SldWorks.ModelDoc2) As String
    Dim values As Variant
    On Error GoTo Failed
    ' No recursive traversal or search-rule resolution; preserve stored references.
    values = model.Extension.GetDependencies(False, False, False, True, True)
    DependenciesJson = "{""status"":""available"",""traverse"":false,""search"":false,""layout"":""alternating name and path; imported paths may be appended with |"",""entries_raw"":" & JsonValue(values) & "}"
    Exit Function
Failed:
    warnings.Add "GetDependencies: " & Err.Description
    DependenciesJson = "{""status"":""unavailable"",""entries_raw"":null}"
End Function

Private Function ConfigurationDataJson(ByVal model As SldWorks.ModelDoc2, ByVal name As String) As String
    Dim conf As SldWorks.Configuration, part As SldWorks.PartDoc
    Dim materialJson As String
    On Error GoTo Failed
    Set conf = model.GetConfigurationByName(name)
    If conf Is Nothing Then Err.Raise vbObjectError + 50, , "Configuratie niet beschikbaar."
    Set part = model
    materialJson = MaterialJson(part, name)
    ConfigurationDataJson = "{""description"":" & Probe(conf, "Description", VbGet, name) & _
        ",""alternate_name"":" & Probe(conf, "AlternateName", VbGet, name) & _
        ",""comment"":" & Probe(conf, "Comment", VbGet, name) & _
        ",""is_derived"":" & Probe(conf, "IsDerived", VbMethod, name) & _
        ",""material"":" & materialJson & "}"
    Exit Function
Failed:
    warnings.Add "Configuratiedetails " & name & ": " & Err.Description
    ConfigurationDataJson = "null"
End Function

Private Function MaterialJson(ByVal part As SldWorks.PartDoc, ByVal name As String) As String
    Dim db As String, material As String
    On Error GoTo Failed
    material = part.GetMaterialPropertyName2(name, db)
    MaterialJson = "{""status"":""available"",""name"":" & J(material) & ",""database"":" & J(db) & _
        ",""meaning"":""Part configuration material; body overrides not resolved""}"
    Exit Function
Failed:
    warnings.Add "Materiaal " & name & ": " & Err.Description
    MaterialJson = "{""status"":""unavailable"",""name"":null}"
End Function

Private Function FeaturesJson(ByVal model As SldWorks.ModelDoc2) As String
    Dim feature As SldWorks.Feature, count As Long, result As String
    Dim seen As Object
    On Error GoTo Failed
    Set seen = CreateObject("Scripting.Dictionary")
    result = "["
    Set feature = model.FirstFeature
    Do While Not feature Is Nothing
        AppendFeature feature, "", 0, count, result, seen
        If count >= 10000 Then
            warnings.Add "Feature-extractie begrensd op 10000 entries."
            Exit Do
        End If
        Set feature = feature.GetNextFeature
    Loop
    FeaturesJson = result & "]"
    Exit Function
Failed:
    failures.Add "Feature-inventaris niet volledig uitleesbaar: " & Err.Description
    FeaturesJson = "null"
End Function

Private Sub AppendFeature(ByVal feature As SldWorks.Feature, ByVal parent As String, ByVal depth As Long, ByRef count As Long, ByRef result As String, ByVal seen As Object)
    Dim name As String, kind As String, path As String, key As String
    Dim child As SldWorks.Feature, item As String
    If count >= 10000 Then Exit Sub
    name = feature.Name
    kind = feature.GetTypeName2
    path = parent & "/" & name
    ' Object identity avoids repeated traversal of the same feature.
    key = CStr(ObjPtr(feature))
    If seen.Exists(key) Then Exit Sub
    seen.Add key, True
    item = "{""name"":" & J(name) & ",""type"":" & J(kind) & ",""path_hint"":" & J(path) & _
        ",""depth"":" & CStr(depth) & ",""id"":" & Probe(feature, "GetID", VbMethod, path)
    If kind = "CutListFolder" Then item = item & ",""cut_list_properties"":" & PropertiesJson(feature.CustomPropertyManager, path)
    item = item & "}"
    If count > 0 Then result = result & ","
    result = result & item
    count = count + 1
    If depth >= 64 Then
        warnings.Add "Featurediepte begrensd bij " & path
        Exit Sub
    End If
    Set child = feature.GetFirstSubFeature
    Do While Not child Is Nothing
        AppendFeature child, path, depth + 1, count, result, seen
        If count >= 10000 Then Exit Do
        Set child = child.GetNextSubFeature
    Loop
End Sub

Private Function BodiesJson(ByVal model As SldWorks.ModelDoc2) As String
    Dim part As SldWorks.PartDoc, body As SldWorks.Body2
    Dim values As Variant, i As Long, result As String
    On Error GoTo Failed
    Set part = model
    values = part.GetBodies2(swAllBodies, False)
    result = "["
    If IsArray(values) Then
        For i = LBound(values) To UBound(values)
            Set body = values(i)
            If i > LBound(values) Then result = result & ","
            result = result & "{""name"":" & J(body.Name) & _
                ",""type_code"":" & Probe(body, "GetType", VbMethod, "body") & _
                ",""face_count"":" & Probe(body, "GetFaceCount", VbMethod, "body") & _
                ",""edge_count"":" & Probe(body, "GetEdgeCount", VbMethod, "body") & _
                ",""bbox_m_approximate"":" & Probe(body, "GetBodyBox", VbMethod, "body") & _
                ",""bbox_layout"":[""xmin"",""ymin"",""zmin"",""xmax"",""ymax"",""zmax""],""context"":""active configuration only; approximate bounds, not a geometry fingerprint""}"
        Next i
    ElseIf Not IsEmpty(values) Then
        If Not IsNull(values) Then Err.Raise vbObjectError + 51, , "GetBodies2 gaf geen array terug."
    End If
    BodiesJson = result & "]"
    Exit Function
Failed:
    failures.Add "Body-inventaris: " & Err.Description
    BodiesJson = "null"
End Function

Private Function EquationsJson(ByVal model As SldWorks.ModelDoc2) As String
    Dim manager As SldWorks.EquationMgr, count As Long, i As Long, result As String
    On Error GoTo Failed
    Set manager = model.GetEquationMgr
    If manager Is Nothing Then
        EquationsJson = "[]"
        Exit Function
    End If
    count = manager.GetCount
    result = "["
    For i = 0 To count - 1
        If i > 0 Then result = result & ","
        result = result & "{""index"":" & CStr(i) & ",""expression"":" & J(manager.Equation(i)) & "}"
    Next i
    EquationsJson = result & "]"
    Exit Function
Failed:
    warnings.Add "Equations: " & Err.Description
    EquationsJson = "null"
End Function

Private Function JsonValue(ByVal value As Variant) As String
    Dim i As Long, result As String
    If IsArray(value) Then
        result = "["
        For i = LBound(value) To UBound(value)
            If i > LBound(value) Then result = result & ","
            result = result & JsonValue(value(i))
        Next i
        JsonValue = result & "]"
    ElseIf IsNull(value) Or IsEmpty(value) Then
        JsonValue = "null"
    Else
        Select Case VarType(value)
            Case vbBoolean: JsonValue = JB(CBool(value))
            Case vbByte, vbInteger, vbLong, vbSingle, vbDouble, vbCurrency, vbDecimal
                ' Str uses a decimal point irrespective of the Windows locale.
                JsonValue = Trim$(Str$(value))
                If Left$(JsonValue, 1) = "." Then JsonValue = "0" & JsonValue
                If Left$(JsonValue, 2) = "-." Then JsonValue = "-0" & Mid$(JsonValue, 2)
            Case vbDate: JsonValue = J(Format$(value, "yyyy-mm-dd\Thh:nn:ss"))
            Case vbString: JsonValue = J(CStr(value))
            Case Else: Err.Raise vbObjectError + 52, , "Niet-ondersteund JSON-waardetype: " & VarType(value)
        End Select
    End If
End Function

Private Function PropertyType(ByVal code As Long) As String
    Select Case code
        Case swCustomInfoText: PropertyType = "text"
        Case swCustomInfoNumber: PropertyType = "number"
        Case swCustomInfoDate: PropertyType = "date"
        Case swCustomInfoYesOrNo: PropertyType = "yes_or_no"
        Case Else: PropertyType = "unknown"
    End Select
End Function

' Encode every control character; preserve UTF-16 code units for ADODB UTF-8.
Private Function J(ByVal value As String) As String
    Dim i As Long, n As Long, c As String, result As String
    For i = 1 To Len(value)
        c = Mid$(value, i, 1)
        n = AscW(c)
        Select Case n
            Case 34: result = result & Chr$(92) & Chr$(34)
            Case 92: result = result & Chr$(92) & Chr$(92)
            Case 0 To 31: result = result & Chr$(92) & "u" & Right$("0000" & Hex$(n), 4)
            Case Else: result = result & c
        End Select
    Next i
    J = Chr$(34) & result & Chr$(34)
End Function

Private Function JB(ByVal value As Boolean) As String
    If value Then JB = "true" Else JB = "false"
End Function

Private Function StringArray(ByVal values As Collection) As String
    Dim i As Long, result As String
    result = "["
    For i = 1 To values.Count
        If i > 1 Then result = result & ","
        result = result & J(CStr(values(i)))
    Next i
    StringArray = result & "]"
End Function

Private Function SelectSourcePart(ByVal app As SldWorks.SldWorks) As String
    Dim fileOptions As Long, configurationName As String, displayName As String
    ' SolidWorks supplies the Windows Open dialog; selecting does not open a document.
    ' Actual opening is performed later with explicit read-only flags in OpenDoc6.
    SelectSourcePart = app.GetOpenFileName( _
        "Printchill - selecteer een gesloten SolidWorks-part", _
        "", _
        "SolidWorks-part (*.sldprt)|*.sldprt|", _
        fileOptions, configurationName, displayName)
End Function

Private Function CleanPath(ByVal value As String) As String
    value = Trim$(value)
    If Len(value) >= 2 Then
        If Left$(value, 1) = Chr$(34) And Right$(value, 1) = Chr$(34) Then value = Mid$(value, 2, Len(value) - 2)
    End If
    CleanPath = value
End Function

Private Function UtcNow() As String
    Dim t As SYSTEMTIME
    GetSystemTime t
    UtcNow = Format$(t.Year, "0000") & "-" & Format$(t.Month, "00") & "-" & Format$(t.Day, "00") & _
        "T" & Format$(t.Hour, "00") & ":" & Format$(t.Minute, "00") & ":" & Format$(t.Second, "00") & "Z"
End Function

Private Function NewGuid() As String
    Dim g As GUID, buffer As String, count As Long
    If CoCreateGuid(g) <> 0 Then Err.Raise vbObjectError + 30, , "Export-ID genereren mislukt."
    buffer = String$(39, vbNullChar)
    count = StringFromGUID2(g, StrPtr(buffer), 39)
    If count = 0 Then Err.Raise vbObjectError + 31, , "Export-ID converteren mislukt."
    NewGuid = LCase$(Mid$(buffer, 2, 36))
End Function

Private Sub WriteUtf8(ByVal path As String, ByVal content As String)
    Dim stream As Object, message As String
    On Error GoTo Failed
    Set stream = CreateObject("ADODB.Stream")
    stream.Type = 2
    stream.Charset = "utf-8"
    stream.Open
    stream.WriteText content
    ' Switch to binary and skip the UTF-8 BOM for ordinary JSON consumers.
    stream.Position = 0
    stream.Type = 1
    stream.Position = 3
    Dim output As Object
    Set output = CreateObject("ADODB.Stream")
    output.Type = 1
    output.Open
    stream.CopyTo output
    output.SaveToFile path, 1
    output.Close
    stream.Close
    Exit Sub
Failed:
    message = Err.Description
    On Error Resume Next
    If Not output Is Nothing Then output.Close
    If Not stream Is Nothing Then stream.Close
    On Error GoTo 0
    Err.Raise vbObjectError + 32, , "UTF-8 schrijven mislukt: " & message
End Sub

Private Sub RestoreActive(ByVal app As SldWorks.SldWorks, ByVal title As String)
    Dim errors As Long, restored As SldWorks.ModelDoc2
    On Error GoTo Failed
    If Len(title) = 0 Then Exit Sub
    ' Explicitly avoid a rebuild when restoring the previously active document.
    Set restored = app.ActivateDoc3(title, False, swDontRebuildActiveDoc, errors)
    If restored Is Nothing Or errors <> 0 Then warnings.Add "Oorspronkelijk actief document niet hersteld; ActivateDoc3-code: " & errors
    Exit Sub
Failed:
    If Not warnings Is Nothing Then warnings.Add "Actief document herstellen mislukt: " & Err.Description
End Sub
